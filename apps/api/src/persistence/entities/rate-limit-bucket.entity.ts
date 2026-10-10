import {Column, Entity, Index, PrimaryColumn} from 'typeorm';

@Entity({name: 'rate_limit_buckets'})
@Index('rate_limit_buckets_expires_at_idx', ['expiresAt'])
export class RateLimitBucket {
	@PrimaryColumn({type: 'varchar', length: 64})
	policy!: string;

	@PrimaryColumn({name: 'key_hash', type: 'varchar', length: 64})
	keyHash!: string;

	@PrimaryColumn({name: 'window_start', type: 'timestamptz'})
	windowStart!: Date;

	@Column({type: 'integer'})
	count!: number;

	@Column({name: 'expires_at', type: 'timestamptz'})
	expiresAt!: Date;
}
