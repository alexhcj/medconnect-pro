import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {RateLimitBucket} from '../persistence/entities/rate-limit-bucket.entity.js';
import {PostgresRateLimitStore} from './postgres-rate-limit-store.js';
import {RateLimitBucketRepository} from './rate-limit-bucket.repository.js';
import {RATE_LIMIT_STORE} from './rate-limit-store.js';

@Module({
	imports: [TypeOrmModule.forFeature([RateLimitBucket])],
	providers: [
		RateLimitBucketRepository,
		PostgresRateLimitStore,
		{provide: RATE_LIMIT_STORE, useExisting: PostgresRateLimitStore},
	],
	exports: [RATE_LIMIT_STORE],
})
export class RateLimitModule {}
