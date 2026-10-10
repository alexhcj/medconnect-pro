import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {RateLimitBucket} from '../persistence/entities/rate-limit-bucket.entity.js';

const KEY_HASH = /^[0-9a-f]{64}$/;
const PRUNE_BATCH = 500;

export type BucketCount = {count: number; resetAt: Date};

@Injectable()
export class RateLimitBucketRepository {
	constructor(
		@InjectRepository(RateLimitBucket)
		private readonly rows: Repository<RateLimitBucket>,
	) {}

	/** Atomically counts one hit in the fixed window containing `now`. */
	async increment(
		policy: string,
		keyHash: string,
		windowMs: number,
		now: Date,
	): Promise<BucketCount> {
		if (!KEY_HASH.test(keyHash)) {
			throw new Error('Rate-limit key must be a 64-character lowercase hex hash');
		}
		if (!Number.isInteger(windowMs) || windowMs <= 0) {
			throw new Error('Rate-limit window must be a positive integer of milliseconds');
		}
		const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
		const resetAt = new Date(windowStart.getTime() + windowMs);

		await this.pruneExpired(now);
		const raw = (await this.rows.query(
			`INSERT INTO "rate_limit_buckets" ("policy", "key_hash", "window_start", "count", "expires_at")
			VALUES ($1, $2, $3, 1, $4)
			ON CONFLICT ("policy", "key_hash", "window_start")
			DO UPDATE SET "count" = "rate_limit_buckets"."count" + 1
			RETURNING "count"`,
			[policy, keyHash, windowStart, resetAt],
		)) as Array<{count: number}>;
		return {count: Number(raw[0].count), resetAt};
	}

	async pruneExpired(now: Date, limit = PRUNE_BATCH): Promise<void> {
		await this.rows.query(
			`DELETE FROM "rate_limit_buckets" WHERE ctid IN (
				SELECT ctid FROM "rate_limit_buckets" WHERE "expires_at" <= $1 LIMIT $2
			)`,
			[now, limit],
		);
	}
}
