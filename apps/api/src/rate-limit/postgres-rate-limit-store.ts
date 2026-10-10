import {Injectable} from '@nestjs/common';
import {RateLimitBucketRepository} from './rate-limit-bucket.repository.js';
import type {BucketCount, RateLimitStore} from './rate-limit-store.js';

@Injectable()
export class PostgresRateLimitStore implements RateLimitStore {
	constructor(private readonly buckets: RateLimitBucketRepository) {}

	increment(policy: string, keyHash: string, windowMs: number, now: Date): Promise<BucketCount> {
		return this.buckets.increment(policy, keyHash, windowMs, now);
	}
}
