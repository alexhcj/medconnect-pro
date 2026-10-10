import type {BucketCount} from './rate-limit-bucket.repository.js';

export type {BucketCount};

export const RATE_LIMIT_STORE = Symbol('RATE_LIMIT_STORE');

/** Fixed-window counter storage (ADR-015). Keys are already HMAC hashes. */
export interface RateLimitStore {
	increment(policy: string, keyHash: string, windowMs: number, now: Date): Promise<BucketCount>;
}
