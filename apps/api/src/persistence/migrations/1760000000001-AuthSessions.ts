import {type MigrationInterface, type QueryRunner} from 'typeorm';

export class AuthSessions1760000000001 implements MigrationInterface {
	name = 'AuthSessions1760000000001';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "auth_sessions" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"user_id" uuid NOT NULL,
				"membership_id" uuid NOT NULL,
				"access_token_hash" character varying(64),
				"refresh_token_hash" character varying(64),
				"previous_refresh_token_hash" character varying(64),
				"mfa_token_hash" character varying(64),
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
				"last_activity_at" TIMESTAMP WITH TIME ZONE NOT NULL,
				"absolute_expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
				"access_expires_at" TIMESTAMP WITH TIME ZONE,
				"mfa_expires_at" TIMESTAMP WITH TIME ZONE,
				"revoked_at" TIMESTAMP WITH TIME ZONE,
				CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "auth_sessions_access_token_hash_key" UNIQUE ("access_token_hash"),
				CONSTRAINT "auth_sessions_refresh_token_hash_key" UNIQUE ("refresh_token_hash"),
				CONSTRAINT "auth_sessions_mfa_token_hash_key" UNIQUE ("mfa_token_hash"),
				CONSTRAINT "auth_sessions_user_id_fkey"
					FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
				CONSTRAINT "auth_sessions_membership_id_fkey"
					FOREIGN KEY ("membership_id") REFERENCES "practice_memberships"("id") ON DELETE RESTRICT
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" ("user_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "auth_sessions_previous_refresh_token_hash_idx" ON "auth_sessions" ("previous_refresh_token_hash")`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS "auth_sessions"`);
	}
}
