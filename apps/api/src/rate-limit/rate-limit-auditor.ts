import type {RateLimitAuditKind, RateLimitRequest} from './rate-limit.policy.js';

export const RATE_LIMIT_AUDITOR = Symbol('RATE_LIMIT_AUDITOR');

/** Writes `auth.rate_limited` when the throttled request resolves to a known practice user. */
export interface RateLimitAuditor {
	recordLimited(kind: RateLimitAuditKind, req: RateLimitRequest): Promise<void>;
}
