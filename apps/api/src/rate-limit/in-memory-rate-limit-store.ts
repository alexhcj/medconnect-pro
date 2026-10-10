import type {BucketCount, RateLimitStore} from './rate-limit-store.js';

/** Tests only. Running processes use the PostgreSQL store. */
export class InMemoryRateLimitStore implements RateLimitStore {
	private readonly buckets = new Map<string, number>();

	async increment(policy: string, keyHash: string, windowMs: number, now: Date): Promise<BucketCount> {
		const windowStart = Math.floor(now.getTime() / windowMs) * windowMs;
		const bucket = `${policy}\n${keyHash}\n${windowStart}`;
		const count = (this.buckets.get(bucket) ?? 0) + 1;
		this.buckets.set(bucket, count);
		return {count, resetAt: new Date(windowStart + windowMs)};
	}

	reset(): void {
		this.buckets.clear();
	}
}
