import {
	Inject,
	Injectable,
	Logger,
	Scope,
	type CanActivate,
	type ExecutionContext,
} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Reflector} from '@nestjs/core';
import {CLOCK, type Clock} from '../identity/clock.js';
import {getCorrelationId} from '../platform/correlation.js';
import type {Env} from '../platform/env.schema.js';
import {RATE_LIMIT_AUDITOR, type RateLimitAuditor} from './rate-limit-auditor.js';
import {RATE_LIMIT_POLICIES_KEY} from './rate-limit.decorator.js';
import {RateLimitedError, RateLimitUnavailableError} from './rate-limit.errors.js';
import {hashRateLimitKey} from './rate-limit-key.js';
import type {RateLimitPolicy, RateLimitRequest} from './rate-limit.policy.js';
import {RATE_LIMIT_STORE, type RateLimitStore} from './rate-limit-store.js';

/**
 * Registered after AuthGuard so session-user keys resolve; AuthGuard is a no-op on @Public routes.
 * Request-scoped because Nest runs static global guards before request-scoped ones, and AuthGuard
 * is request-scoped.
 */
@Injectable({scope: Scope.REQUEST})
export class RateLimitGuard implements CanActivate {
	private readonly logger = new Logger(RateLimitGuard.name);
	private readonly secret: string;

	constructor(
		@Inject(Reflector) private readonly reflector: Reflector,
		@Inject(RATE_LIMIT_STORE) private readonly store: RateLimitStore,
		@Inject(CLOCK) private readonly clock: Clock,
		@Inject(ConfigService) config: ConfigService<Env, true>,
		@Inject(RATE_LIMIT_AUDITOR) private readonly auditor: RateLimitAuditor,
	) {
		this.secret = config.get('RATE_LIMIT_KEY_SECRET', {infer: true});
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const policies = this.reflector.getAllAndOverride<RateLimitPolicy[] | undefined>(
			RATE_LIMIT_POLICIES_KEY,
			[context.getHandler(), context.getClass()],
		);
		if (!policies || policies.length === 0) {
			return true;
		}
		const request = context.switchToHttp().getRequest<RateLimitRequest>();
		for (const policy of policies) {
			await this.check(policy, request);
		}
		return true;
	}

	private async check(policy: RateLimitPolicy, request: RateLimitRequest): Promise<void> {
		const raw = policy.key(request);
		if (raw === undefined) {
			return;
		}
		const now = this.clock.now();
		let bucket;
		try {
			bucket = await this.store.increment(
				policy.name,
				hashRateLimitKey(this.secret, policy.name, raw),
				policy.windowMs,
				now,
			);
		} catch {
			if (policy.failure === 'closed') {
				throw new RateLimitUnavailableError();
			}
			this.logger.warn('Rate limit store unavailable; failing open', {
				policy: policy.name,
				correlationId: getCorrelationId(request),
			});
			return;
		}
		if (bucket.count > policy.limit) {
			if (bucket.count === policy.limit + 1 && policy.audit) {
				await this.audit(policy, request);
			}
			const retryAfterSeconds = Math.max(
				1,
				Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000),
			);
			throw new RateLimitedError(retryAfterSeconds);
		}
	}

	private async audit(policy: RateLimitPolicy, request: RateLimitRequest): Promise<void> {
		try {
			await this.auditor.recordLimited(policy.audit!, request);
		} catch {
			this.logger.warn('Failed to record auth.rate_limited audit event', {
				policy: policy.name,
				correlationId: getCorrelationId(request),
			});
		}
	}
}
