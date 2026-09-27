import {type MigrationInterface, type QueryRunner} from 'typeorm';

const APP_ROLE = 'medconnect_app';
const NOTIFICATIONS = 'notifications';
const PREFERENCES = 'notification_preferences';

export class Notifications1760000000009 implements MigrationInterface {
	name = 'Notifications1760000000009';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "${NOTIFICATIONS}" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"recipient_user_id" uuid NOT NULL,
				"channel" character varying(32) NOT NULL,
				"type" character varying(32) NOT NULL,
				"title" character varying(200) NOT NULL,
				"body" character varying(1000) NOT NULL,
				"status" character varying(32) NOT NULL,
				"attempt_count" integer NOT NULL DEFAULT 0,
				"last_attempt_at" TIMESTAMP WITH TIME ZONE,
				"delivered_at" TIMESTAMP WITH TIME ZONE,
				"read_at" TIMESTAMP WITH TIME ZONE,
				"synthetic" boolean NOT NULL DEFAULT true,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "notifications_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "notifications_recipient_user_id_fkey"
					FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
				CONSTRAINT "notifications_channel_check"
					CHECK ("channel" IN ('in_app', 'email', 'sms')),
				CONSTRAINT "notifications_type_check"
					CHECK ("type" IN ('generic', 'appointment_changed')),
				CONSTRAINT "notifications_status_check"
					CHECK ("status" IN ('pending', 'delivered', 'failed'))
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "notifications_practice_id_recipient_user_id_created_at_idx" ON "${NOTIFICATIONS}" ("practice_id", "recipient_user_id", "created_at")`,
		);
		await queryRunner.query(
			`CREATE INDEX "notifications_pending_delivery_idx" ON "${NOTIFICATIONS}" ("practice_id", "id") WHERE "status" = 'pending'`,
		);

		await queryRunner.query(`
			CREATE TABLE "${PREFERENCES}" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"user_id" uuid NOT NULL,
				"in_app_enabled" boolean NOT NULL DEFAULT true,
				"email_enabled" boolean NOT NULL DEFAULT true,
				"sms_enabled" boolean NOT NULL DEFAULT true,
				"synthetic" boolean NOT NULL DEFAULT true,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "notification_preferences_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "notification_preferences_user_id_fkey"
					FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
			)
		`);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "notification_preferences_practice_id_user_id_uidx" ON "${PREFERENCES}" ("practice_id", "user_id")`,
		);

		for (const table of [NOTIFICATIONS, PREFERENCES]) {
			await queryRunner.query(
				`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "${table}" TO ${APP_ROLE}`,
			);
			await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
			await queryRunner.query(`
				CREATE POLICY "${table}_tenant_isolation" ON "${table}"
				USING (
					"practice_id" = NULLIF(current_setting('app.current_practice_id', true), '')::uuid
				)
				WITH CHECK (
					"practice_id" = NULLIF(current_setting('app.current_practice_id', true), '')::uuid
				)
			`);
		}
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		for (const table of [PREFERENCES, NOTIFICATIONS]) {
			await queryRunner.query(`DROP POLICY IF EXISTS "${table}_tenant_isolation" ON "${table}"`);
			await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
			await queryRunner.query(
				`REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "${table}" FROM ${APP_ROLE}`,
			);
			await queryRunner.query(`DROP TABLE IF EXISTS "${table}"`);
		}
	}
}
