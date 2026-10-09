import {type MigrationInterface, type QueryRunner} from 'typeorm';

const APP_ROLE = 'medconnect_app';
const IDENTITIES = 'external_identities';
const FLOW_STATES = 'oauth_flow_states';

export class ExternalIdentity1760000000011 implements MigrationInterface {
	name = 'ExternalIdentity1760000000011';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "${IDENTITIES}" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"user_id" uuid NOT NULL,
				"provider" character varying(32) NOT NULL,
				"subject" character varying(255) NOT NULL,
				"email_at_link" character varying(320),
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "external_identities_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "external_identities_provider_subject_key" UNIQUE ("provider", "subject"),
				CONSTRAINT "external_identities_user_id_provider_key" UNIQUE ("user_id", "provider"),
				CONSTRAINT "external_identities_user_id_fkey"
					FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
			)
		`);

		await queryRunner.query(`
			CREATE TABLE "${FLOW_STATES}" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"provider" character varying(32) NOT NULL,
				"state_hash" character varying(64) NOT NULL,
				"code_verifier" character varying(128) NOT NULL,
				"nonce" character varying(128) NOT NULL,
				"return_to" character varying(2048) NOT NULL,
				"expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
				"consumed_at" TIMESTAMP WITH TIME ZONE,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "oauth_flow_states_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "oauth_flow_states_state_hash_key" UNIQUE ("state_hash")
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "oauth_flow_states_expires_at_idx" ON "${FLOW_STATES}" ("expires_at")`,
		);

		for (const table of [IDENTITIES, FLOW_STATES]) {
			await queryRunner.query(
				`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "${table}" TO ${APP_ROLE}`,
			);
		}
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		for (const table of [FLOW_STATES, IDENTITIES]) {
			await queryRunner.query(
				`REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "${table}" FROM ${APP_ROLE}`,
			);
			await queryRunner.query(`DROP TABLE IF EXISTS "${table}"`);
		}
	}
}
