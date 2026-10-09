import {randomBytes} from 'node:crypto';
import {Inject, Injectable} from '@nestjs/common';
import {REQUEST} from '@nestjs/core';
import type {Request} from 'express';
import {AuditEventRepository} from '../audit/audit-event.repository.js';
import type {User} from '../persistence/entities/user.entity.js';
import {getCorrelationId} from '../platform/correlation.js';
import {AuthService, type TokenPair} from './auth.service.js';
import type {Clock} from './clock.js';
import {CLOCK} from './clock.js';
import {ExternalIdentityRepository} from './external-identity.repository.js';
import {IdentityMembershipLookup} from './membership-lookup.js';
import {OAuthFlowStateRepository} from './oauth-flow-state.repository.js';
import {pkceChallenge} from './oidc/fake-oidc.adapter.js';
import {
	OIDC_PROVIDER_PORT,
	OidcExchangeError,
	type OidcIdTokenClaims,
	type OidcProviderPort,
} from './oidc/oidc-provider.port.js';
import {hashToken} from './token.js';

export const OAUTH_FLOW_TTL_MS = 10 * 60 * 1000;
export const DEFAULT_RETURN_TO = '/dashboard';
const CLOCK_SKEW_SECONDS = 60;

/** Relative in-app paths only: `/dashboard` and its children. No scheme, host, `//`, or `..`. */
const RETURN_TO_PATTERN = /^\/dashboard(?:\/[A-Za-z0-9\-._~/]*)?(?:\?[A-Za-z0-9\-._~=&%]*)?$/;

export function isAllowedReturnTo(value: string): boolean {
	return (
		value.length <= 512 &&
		RETURN_TO_PATTERN.test(value) &&
		!value.includes('//') &&
		!value.split('?')[0].split('/').includes('..')
	);
}

/** Server-side failure reason. Never sent to the browser. */
export class OAuthFlowError extends Error {
	constructor(
		readonly reason: string,
		readonly userId?: string,
	) {
		super('OAuth sign-in failed');
		this.name = 'OAuthFlowError';
	}
}

export class OAuthUnavailableError extends Error {
	constructor() {
		super('OAuth sign-in is not configured in this environment');
		this.name = 'OAuthUnavailableError';
	}
}

export class OAuthBadRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'OAuthBadRequestError';
	}
}

export type OAuthCallbackResult = {tokens: TokenPair; returnTo: string};

@Injectable()
export class OAuthService {
	constructor(
		@Inject(OIDC_PROVIDER_PORT) private readonly provider: OidcProviderPort,
		private readonly flows: OAuthFlowStateRepository,
		private readonly identities: ExternalIdentityRepository,
		private readonly memberships: IdentityMembershipLookup,
		private readonly auth: AuthService,
		private readonly audit: AuditEventRepository,
		@Inject(CLOCK) private readonly clock: Clock,
		@Inject(REQUEST) private readonly request: Request,
	) {}

	assertProvider(provider: string): void {
		if (provider !== this.provider.key) {
			throw new OAuthBadRequestError('Unknown OAuth provider');
		}
	}

	async start(provider: string, returnTo: string | undefined): Promise<string> {
		this.assertProvider(provider);
		if (!this.provider.available) {
			throw new OAuthUnavailableError();
		}
		const target = returnTo ?? DEFAULT_RETURN_TO;
		if (!isAllowedReturnTo(target)) {
			throw new OAuthBadRequestError('returnTo must be a relative in-app path');
		}
		const state = randomBytes(32).toString('base64url');
		const codeVerifier = randomBytes(48).toString('base64url');
		const nonce = randomBytes(32).toString('base64url');
		const now = this.clock.now();
		await this.flows.create(
			{
				provider: this.provider.key,
				stateHash: hashToken(state),
				codeVerifier,
				nonce,
				returnTo: target,
				expiresAt: new Date(now.getTime() + OAUTH_FLOW_TTL_MS),
			},
			now,
		);
		return this.provider.buildAuthorizeUrl({
			state,
			codeChallenge: pkceChallenge(codeVerifier),
			nonce,
		});
	}

	async callback(
		provider: string,
		input: {code?: string; state?: string; error?: string},
	): Promise<OAuthCallbackResult> {
		this.assertProvider(provider);
		if (!input.state) {
			throw new OAuthFlowError('state_missing');
		}
		const flow = await this.flows.consume(hashToken(input.state), this.clock.now());
		if (!flow || flow.provider !== this.provider.key) {
			throw new OAuthFlowError('state_invalid');
		}
		if (input.error || !input.code) {
			throw new OAuthFlowError('provider_error');
		}
		let claims: OidcIdTokenClaims;
		try {
			claims = await this.provider.exchangeCode({
				code: input.code,
				state: input.state,
				codeVerifier: flow.codeVerifier,
				nonce: flow.nonce,
			});
		} catch (error) {
			throw new OAuthFlowError(error instanceof OidcExchangeError ? error.reason : 'exchange_failed');
		}
		const verified = this.verifyClaims(claims, flow.nonce);
		const user = await this.resolveUser(verified);
		let issued: Awaited<ReturnType<AuthService['issueSessionForUser']>>;
		try {
			issued = await this.auth.issueSessionForUser(user.id);
		} catch {
			throw new OAuthFlowError('membership_unresolved', user.id);
		}
		await this.record('auth.oauth.succeeded', 'session', issued.session.id, {
			practiceId: issued.membership.practiceId,
			actorUserId: user.id,
		});
		return {tokens: issued.pair, returnTo: flow.returnTo};
	}

	/** Records `auth.oauth.failed` when the failing user is known; anonymous failures have no tenant. */
	async recordFailure(error: unknown): Promise<void> {
		const userId = error instanceof OAuthFlowError ? error.userId : undefined;
		if (!userId) {
			return;
		}
		await this.recordForUser('auth.oauth.failed', 'session', null, userId);
	}

	private verifyClaims(
		claims: OidcIdTokenClaims,
		expectedNonce: string,
	): {sub: string; email: string} {
		if (claims.iss !== this.provider.issuer) {
			throw new OAuthFlowError('iss_mismatch');
		}
		const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
		if (!audiences.includes(this.provider.clientId)) {
			throw new OAuthFlowError('aud_mismatch');
		}
		const nowSeconds = Math.floor(this.clock.now().getTime() / 1000);
		if (typeof claims.exp !== 'number' || claims.exp + CLOCK_SKEW_SECONDS <= nowSeconds) {
			throw new OAuthFlowError('token_expired');
		}
		if (claims.nonce !== expectedNonce) {
			throw new OAuthFlowError('nonce_mismatch');
		}
		if (typeof claims.sub !== 'string' || claims.sub.length === 0 || claims.sub.length > 255) {
			throw new OAuthFlowError('sub_invalid');
		}
		if (typeof claims.email !== 'string' || claims.email.length === 0) {
			throw new OAuthFlowError('email_missing');
		}
		if (claims.email_verified !== true) {
			throw new OAuthFlowError('email_unverified');
		}
		return {sub: claims.sub, email: claims.email.trim().toLowerCase()};
	}

	/** ADR-014 mapping: (provider, sub) → user; else verified email → first link; else reject. */
	private async resolveUser(claims: {sub: string; email: string}): Promise<User> {
		const providerKey = this.provider.key;
		const linked = await this.identities.findByProviderSubject(providerKey, claims.sub);
		if (linked) {
			const user = await this.memberships.findUserById(linked.userId);
			if (!user) {
				throw new OAuthFlowError('linked_user_missing');
			}
			const emailOwner = await this.memberships.findUserByEmail(claims.email);
			if (emailOwner && emailOwner.id !== user.id) {
				await this.recordForUser('auth.oauth.identity_mismatch', 'external_identity', linked.id, user.id);
				throw new OAuthFlowError('identity_mismatch', user.id);
			}
			return user;
		}
		const user = await this.memberships.findUserByEmail(claims.email);
		if (!user) {
			throw new OAuthFlowError('unknown_email');
		}
		const existing = await this.identities.findByUserProvider(user.id, providerKey);
		if (existing) {
			await this.recordForUser('auth.oauth.identity_mismatch', 'external_identity', existing.id, user.id);
			throw new OAuthFlowError('identity_mismatch', user.id);
		}
		let created;
		try {
			created = await this.identities.insert({
				userId: user.id,
				provider: providerKey,
				subject: claims.sub,
				emailAtLink: claims.email,
			});
		} catch {
			await this.recordForUser('auth.oauth.identity_mismatch', 'external_identity', null, user.id);
			throw new OAuthFlowError('identity_mismatch', user.id);
		}
		await this.recordForUser('auth.oauth.linked', 'external_identity', created.id, user.id);
		return user;
	}

	private async recordForUser(
		action: string,
		resourceType: string,
		resourceId: string | null,
		userId: string,
	): Promise<void> {
		const [membership] = await this.memberships.listForUser(userId);
		if (!membership) {
			return;
		}
		await this.record(action, resourceType, resourceId, {
			practiceId: membership.practiceId,
			actorUserId: userId,
		});
	}

	private async record(
		action: string,
		resourceType: string,
		resourceId: string | null,
		scope: {practiceId: string; actorUserId: string},
	): Promise<void> {
		await this.audit.record(
			{action, resourceType, resourceId, correlationId: getCorrelationId(this.request)},
			scope,
		);
	}
}