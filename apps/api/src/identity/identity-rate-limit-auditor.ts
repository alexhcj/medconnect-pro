import {Injectable} from '@nestjs/common';
import {AuditEventRepository} from '../audit/audit-event.repository.js';
import {getCorrelationId} from '../platform/correlation.js';
import type {RateLimitAuditor} from '../rate-limit/rate-limit-auditor.js';
import {mfaTokenFrom, normalizedLoginEmail} from '../rate-limit/rate-limit.policies.js';
import type {RateLimitAuditKind, RateLimitRequest} from '../rate-limit/rate-limit.policy.js';
import type {RequestTenantScope} from '../tenancy/tenant-rls.interceptor.js';
import {IdentityMembershipLookup, resolveAttributableMembership} from './membership-lookup.js';
import {SessionRepository} from './session.repository.js';
import {hashToken} from './token.js';

type AuditScope = {practiceId: string; actorUserId: string};

@Injectable()
export class IdentityRateLimitAuditor implements RateLimitAuditor {
	constructor(
		private readonly memberships: IdentityMembershipLookup,
		private readonly sessions: SessionRepository,
		private readonly audit: AuditEventRepository,
	) {}

	async recordLimited(kind: RateLimitAuditKind, req: RateLimitRequest): Promise<void> {
		const scope = await this.resolve(kind, req as RateLimitRequest & RequestTenantScope);
		if (!scope) {
			return;
		}
		await this.audit.record(
			{
				action: 'auth.rate_limited',
				resourceType: 'session',
				resourceId: null,
				correlationId: getCorrelationId(req),
			},
			scope,
		);
	}

	private async resolve(
		kind: RateLimitAuditKind,
		req: RateLimitRequest & RequestTenantScope,
	): Promise<AuditScope | undefined> {
		switch (kind) {
			case 'login_email': {
				const email = normalizedLoginEmail(req);
				const user = email ? await this.memberships.findUserByEmail(email) : undefined;
				if (!user) {
					return undefined;
				}
				const body = req.body as {practiceId?: unknown} | undefined;
				const practiceId = typeof body?.practiceId === 'string' ? body.practiceId : undefined;
				const membership = resolveAttributableMembership(
					await this.memberships.listForUser(user.id),
					practiceId,
				);
				return membership ? {practiceId: membership.practiceId, actorUserId: user.id} : undefined;
			}
			case 'mfa_session': {
				const token = mfaTokenFrom(req);
				const session = token ? await this.sessions.findByMfaHash(hashToken(token)) : undefined;
				if (!session) {
					return undefined;
				}
				const membership = await this.memberships.getById(session.membershipId);
				return membership
					? {practiceId: membership.practiceId, actorUserId: session.userId}
					: undefined;
			}
			case 'session_user':
				return req.tenantPracticeId && req.authUserId
					? {practiceId: req.tenantPracticeId, actorUserId: req.authUserId}
					: undefined;
		}
	}
}
