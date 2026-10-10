import {type MigrationInterface, type QueryRunner} from 'typeorm';

const APP_ROLE = 'medconnect_app';
const BUCKETS = 'rate_limit_buckets';

export class RateLimitBuckets1760000000012 implements MigrationInterface {
	name = 'RateLimitBuckets1760000000012';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "${BUCKETS}" (
				"policy" character varying(64) NOT NULL,
				"key_hash" character varying(64) NOT NULL,
				"window_start" TIMESTAMP WITH TIME ZONE NOT NULL,
				"count" integer NOT NULL,
				"expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
				CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("policy", "key_hash", "window_start"),
				CONSTRAINT "rate_limit_buckets_key_hash_check" CHECK ("key_hash" ~ '^[0-9a-f]{64}$')
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "rate_limit_buckets_expires_at_idx" ON "${BUCKETS}" ("expires_at")`,
		);
		await queryRunner.query(
			`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "${BUCKETS}" TO ${APP_ROLE}`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "${BUCKETS}" FROM ${APP_ROLE}`,
		);
		await queryRunner.query(`DROP TABLE IF EXISTS "${BUCKETS}"`);
	}
}
