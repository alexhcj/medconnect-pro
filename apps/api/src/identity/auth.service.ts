import {Inject, Injectable} from '@nestjs/common';
import {REQUEST} from '@nestjs/core';
import type {Request} from 'express';
import {AuditEventRepository} from '../audit/audit-event.repository.js';
import type {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import type {AuthSession} from '../persistence/entities/auth-session.entity.js';
import {getCorrelationId} from '../platform/correlation.js';
import {isPracticeRole} from '../tenancy/practice-role.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';
import {
	InvalidCredentialsError,
	MembershipUnresolvedError,
	MfaInvalidError,
	SessionInvalidError,
} from './auth.errors.js';
import type {Clock} from './clock.js';
import {CLOCK} from './clock.js';
import {IdentityMembershipLookup} from './membership-lookup.js';
import {matchMockIdpAccount, MOCK_IDP_USERS, type MockIdpAccount} from './mock-idp.js';
import {SessionRepository} from './session.repository.js';
import {ABSOLUTE_TTL_MS, ACCESS_TTL_MS, IDLE_TTL_MS, MFA_TTL_MS} from './session-policy.js';
import {generateToken, hashToken, constantTimeEqual} from './token.js';

export type TokenPair = {
	tokenType: 'Bearer';
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
};

export type LoginResult = ({kind: 'tokens'} & TokenPair) | {
	kind: 'mfa';
	mfaRequired: true;
	mfaToken: string;
	expiresIn: number;
};

export type AuthenticatedSession = {
	session: AuthSession;
	membership: PracticeMembership;
};

type AuditScope = {
	practiceId: string;
	actorUserId: string;
};

@Injectable()
export class AuthService {
	constructor(
		private readonly sessions: SessionRepository,
		private readonly memberships: IdentityMembershipLookup,
		@Inject(MOCK_IDP_USERS) private readonly accounts: readonly MockIdpAccount[],
		@Inject(CLOCK) private readonly clock: Clock,
		private readonly audit: AuditEventRepository,
		@Inject(REQUEST) private readonly request: Request,
	) {}

	async login(input: {
		email: string;
		password: string;
		practiceId?: string;
	}): Promise<LoginResult> {
		const account = matchMockIdpAccount(this.accounts, input.email, input.password);
		if (!account) {
			throw new InvalidCredentialsError();
		}
		const user = await this.memberships.findUserByEmail(account.email);
		if (!user) {
			throw new InvalidCredentialsError();
		}
		const membership = this.bindMembership(
			await this.memberships.listForUser(user.id),
			input.practiceId,
		);
		const now = this.clock.now();
		if (account.mfaRequired) {
			const mfaToken = generateToken();
			await this.sessions.insert({
				userId: user.id,
				membershipId: membership.id,
				accessTokenHash: null,
				refreshTokenHash: null,
				previousRefreshTokenHash: null,
				mfaTokenHash: hashToken(mfaToken),
				mfaExpiresAt: new Date(now.getTime() + MFA_TTL_MS),
				createdAt: now,
				lastActivityAt: now,
				absoluteExpiresAt: new Date(now.getTime() + ABSOLUTE_TTL_MS),
				accessExpiresAt: null,
			});
			return {
				kind: 'mfa',
				mfaRequired: true,
				mfaToken,
				expiresIn: Math.floor(MFA_TTL_MS / 1000),
			};
		}
		const {pair, session} = await this.insertSession(user.id, membership.id, now);
		await this.recordAuth('auth.login.succeeded', session.id, {
			practiceId: membership.practiceId,
			actorUserId: user.id,
		});
		return {kind: 'tokens', ...pair};
	}

	async verifyMfa(mfaToken: string, code: string): Promise<TokenPair> {
		const now = this.clock.now();
		const session = await this.sessions.findByMfaHash(hashToken(mfaToken));
		if (!session || session.accessTokenHash) {
			throw new MfaInvalidError();
		}
		if (
			session.revokedAt ||
			!session.mfaExpiresAt ||
			session.mfaExpiresAt.getTime() <= now.getTime() ||
			session.absoluteExpiresAt.getTime() <= now.getTime()
		) {
			await this.recordMfaFailure(session);
			throw new MfaInvalidError();
		}
		const user = await this.memberships.findUserById(session.userId);
		const account = user
			? this.accounts.find((item) => item.email.toLowerCase() === user.email.toLowerCase())
			: undefined;
		if (!account?.mfaRequired || !account.mfaCode || !constantTimeEqual(code, account.mfaCode)) {
			await this.recordMfaFailure(session);
			throw new MfaInvalidError();
		}
		const membership = await this.memberships.getById(session.membershipId);
		if (!membership || membership.userId !== session.userId || !isPracticeRole(membership.role)) {
			throw new MfaInvalidError();
		}
		const tokens = await this.rotate(session, now);
		await this.recordAuth('auth.mfa.succeeded', session.id, {
			practiceId: membership.practiceId,
			actorUserId: session.userId,
		});
		return tokens;
	}

	async refresh(refreshToken: string): Promise<TokenPair> {
		const now = this.clock.now();
		const hash = hashToken(refreshToken);
		const current = await this.sessions.findByRefreshHash(hash);
		if (!current) {
			const reused = await this.sessions.findByPreviousRefreshHash(hash);
			if (reused && !reused.revokedAt) {
				await this.sessions.revoke(reused.id, now);
				const membership = await this.memberships.getById(reused.membershipId);
				if (membership) {
					await this.recordAuth('auth.refresh.reuse', reused.id, {
						practiceId: membership.practiceId,
						actorUserId: reused.userId,
					});
				}
			}
			throw new SessionInvalidError();
		}
		this.assertAlive(current, now);
		return this.rotate(current, now);
	}

	async authenticate(accessToken: string): Promise<AuthenticatedSession> {
		const now = this.clock.now();
		const session = await this.sessions.findByAccessHash(hashToken(accessToken));
		if (!session?.accessExpiresAt || session.accessExpiresAt.getTime() <= now.getTime()) {
			throw new SessionInvalidError();
		}
		this.assertAlive(session, now);
		const membership = await this.memberships.getById(session.membershipId);
		if (!membership || membership.userId !== session.userId || !isPracticeRole(membership.role)) {
			throw new SessionInvalidError();
		}
		session.lastActivityAt = now;
		const saved = await this.sessions.save(session);
		return {session: saved, membership};
	}

	async logout(sessionId: string): Promise<void> {
		const session = await this.sessions.findById(sessionId);
		await this.sessions.revoke(sessionId, this.clock.now());
		if (!session) {
			return;
		}
		const membership = await this.memberships.getById(session.membershipId);
		if (!membership) {
			return;
		}
		await this.recordAuth('auth.logout', sessionId, {
			practiceId: membership.practiceId,
			actorUserId: session.userId,
		});
	}

	async logoutAll(userId: string): Promise<void> {
		const memberships = await this.memberships.listForUser(userId);
		await this.sessions.revokeAllForUser(userId, this.clock.now());
		const membership = memberships[0];
		if (!membership) {
			return;
		}
		await this.recordAuth('auth.logout_all', null, {
			practiceId: membership.practiceId,
			actorUserId: userId,
		});
	}

	private bindMembership(
		memberships: PracticeMembership[],
		practiceId: string | undefined,
	): PracticeMembership {
		if (memberships.length === 0) {
			throw new InvalidCredentialsError();
		}
		if (practiceId !== undefined) {
			const selected = memberships.find((membership) => membership.practiceId === practiceId);
			if (!selected) {
				throw new TenantMismatchError();
			}
			return selected;
		}
		if (memberships.length !== 1) {
			throw new MembershipUnresolvedError();
		}
		const only = memberships[0];
		if (!only) {
			throw new MembershipUnresolvedError();
		}
		return only;
	}

	private assertAlive(session: AuthSession, now: Date): void {
		if (session.revokedAt) {
			throw new SessionInvalidError();
		}
		if (session.absoluteExpiresAt.getTime() <= now.getTime()) {
			throw new SessionInvalidError();
		}
		if (now.getTime() - session.lastActivityAt.getTime() >= IDLE_TTL_MS) {
			throw new SessionInvalidError();
		}
	}

	private accessExpiry(absoluteExpiresAt: Date, now: Date): Date {
		const capped = Math.min(now.getTime() + ACCESS_TTL_MS, absoluteExpiresAt.getTime());
		if (capped <= now.getTime()) {
			throw new SessionInvalidError();
		}
		return new Date(capped);
	}

	private expiresIn(accessExpiresAt: Date, now: Date): number {
		return Math.max(0, Math.floor((accessExpiresAt.getTime() - now.getTime()) / 1000));
	}

	private async insertSession(
		userId: string,
		membershipId: string,
		now: Date,
	): Promise<{pair: TokenPair; session: AuthSession}> {
		const absoluteExpiresAt = new Date(now.getTime() + ABSOLUTE_TTL_MS);
		const accessToken = generateToken();
		const refreshToken = generateToken();
		const accessExpiresAt = this.accessExpiry(absoluteExpiresAt, now);
		const session = await this.sessions.insert({
			userId,
			membershipId,
			accessTokenHash: hashToken(accessToken),
			refreshTokenHash: hashToken(refreshToken),
			previousRefreshTokenHash: null,
			mfaTokenHash: null,
			mfaExpiresAt: null,
			createdAt: now,
			lastActivityAt: now,
			absoluteExpiresAt,
			accessExpiresAt,
		});
		return {
			session,
			pair: {
				tokenType: 'Bearer',
				accessToken,
				refreshToken,
				expiresIn: this.expiresIn(accessExpiresAt, now),
			},
		};
	}

	private async rotate(session: AuthSession, now: Date): Promise<TokenPair> {
		const accessToken = generateToken();
		const refreshToken = generateToken();
		const accessExpiresAt = this.accessExpiry(session.absoluteExpiresAt, now);
		session.previousRefreshTokenHash = session.refreshTokenHash;
		session.refreshTokenHash = hashToken(refreshToken);
		session.accessTokenHash = hashToken(accessToken);
		session.accessExpiresAt = accessExpiresAt;
		session.lastActivityAt = now;
		session.mfaTokenHash = null;
		session.mfaExpiresAt = null;
		await this.sessions.save(session);
		return {
			tokenType: 'Bearer',
			accessToken,
			refreshToken,
			expiresIn: this.expiresIn(accessExpiresAt, now),
		};
	}

	private async recordMfaFailure(session: AuthSession): Promise<void> {
		const membership = await this.memberships.getById(session.membershipId);
		if (!membership) {
			return;
		}
		await this.recordAuth('auth.mfa.failed', session.id, {
			practiceId: membership.practiceId,
			actorUserId: session.userId,
		});
	}

	private async recordAuth(
		action: string,
		resourceId: string | null,
		scope: AuditScope,
	): Promise<void> {
		await this.audit.record(
			{
				action,
				resourceType: 'session',
				resourceId,
				correlationId: getCorrelationId(this.request),
			},
			scope,
		);
	}
}
