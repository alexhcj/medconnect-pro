import {Inject, Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {CLOCK, type Clock} from '../identity/clock.js';
import type {Env} from '../platform/env.schema.js';
import {RateLimitedError, RateLimitUnavailableError} from './rate-limit.errors.js';
import {hashRateLimitKey, normalizeEmail} from './rate-limit-key.js';
import {RATE_LIMIT_POLICIES} from './rate-limit.policies.js';
import {RATE_LIMIT_STORE, type BucketCount, type RateLimitStore} from './rate-limit-store.js';

const policy = RATE_LIMIT_POLICIES.loginAccountFailures;

/**
 * Account-wide failed-login budget across client IPs. Only failures count, so the owner's
 * successful logins never consume it; unknown emails count too, so a 429 reveals nothing.
 */
@Injectable()
export class AccountLoginLimiter {
	private readonly secret: string;

	constructor(
		@Inject(RATE_LIMIT_STORE) private readonly store: RateLimitStore,
		@Inject(CLOCK) private readonly clock: Clock,
		@Inject(ConfigService) config: ConfigService<Env, true>,
	) {
		this.secret = config.get('RATE_LIMIT_KEY_SECRET', {infer: true});
	}

	/** Throws 429 while the account is cooling down; fails closed when the store is down. */
	async assertAllowed(email: string): Promise<void> {
		const now = this.clock.now();
		const bucket = await this.call(() =>
			this.store.peek(policy.name, this.keyHash(email), policy.windowMs, now),
		);
		if (bucket.count >= policy.limit) {
			throw new RateLimitedError(retryAfterSeconds(bucket, now));
		}
	}

	/** Counts one failed attempt. `firstRejection` is true exactly once per window. */
	async recordFailure(email: string): Promise<{firstRejection: boolean}> {
		const bucket = await this.call(() =>
			this.store.increment(policy.name, this.keyHash(email), policy.windowMs, this.clock.now()),
		);
		return {firstRejection: bucket.count === policy.limit};
	}

	private keyHash(email: string): string {
		return hashRateLimitKey(this.secret, policy.name, normalizeEmail(email));
	}

	private async call(fn: () => Promise<BucketCount>): Promise<BucketCount> {
		try {
			return await fn();
		} catch {
			throw new RateLimitUnavailableError();
		}
	}
}

function retryAfterSeconds(bucket: BucketCount, now: Date): number {
	return Math.max(1, Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000));
}
