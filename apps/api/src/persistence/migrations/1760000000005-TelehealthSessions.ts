import {type MigrationInterface, type QueryRunner} from 'typeorm';

export class TelehealthSessions1760000000005 implements MigrationInterface {
	name = 'TelehealthSessions1760000000005';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "telehealth_sessions" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"appointment_id" uuid NOT NULL,
				"state" character varying(32) NOT NULL,
				"waiting_started_at" TIMESTAMP WITH TIME ZONE NOT NULL,
				"joined_at" TIMESTAMP WITH TIME ZONE,
				"ended_at" TIMESTAMP WITH TIME ZONE,
				"synthetic" boolean NOT NULL DEFAULT true,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "telehealth_sessions_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "telehealth_sessions_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "telehealth_sessions_appointment_id_fkey"
					FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT,
				CONSTRAINT "telehealth_sessions_appointment_id_key" UNIQUE ("appointment_id"),
				CONSTRAINT "telehealth_sessions_state_check"
					CHECK ("state" IN ('waiting', 'in_session', 'ended'))
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "telehealth_sessions_practice_id_idx" ON "telehealth_sessions" ("practice_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "telehealth_sessions_practice_id_state_idx" ON "telehealth_sessions" ("practice_id", "state")`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS "telehealth_sessions"`);
	}
}
