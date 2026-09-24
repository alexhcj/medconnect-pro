import {type MigrationInterface, type QueryRunner} from 'typeorm';

export class Appointments1760000000003 implements MigrationInterface {
	name = 'Appointments1760000000003';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);
		await queryRunner.query(`
			CREATE TABLE "appointments" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"patient_id" uuid NOT NULL,
				"provider_user_id" uuid NOT NULL,
				"start_at" TIMESTAMP WITH TIME ZONE NOT NULL,
				"end_at" TIMESTAMP WITH TIME ZONE NOT NULL,
				"type" character varying(32) NOT NULL,
				"state" character varying(32) NOT NULL,
				"notes" character varying(500),
				"synthetic" boolean NOT NULL DEFAULT true,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "appointments_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "appointments_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "appointments_patient_id_fkey"
					FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT,
				CONSTRAINT "appointments_provider_user_id_fkey"
					FOREIGN KEY ("provider_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
				CONSTRAINT "appointments_type_check"
					CHECK ("type" IN ('office_visit', 'telehealth', 'follow_up')),
				CONSTRAINT "appointments_state_check"
					CHECK ("state" IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
				CONSTRAINT "appointments_end_after_start_check"
					CHECK ("end_at" > "start_at"),
				CONSTRAINT "appointments_provider_during_excl"
					EXCLUDE USING gist (
						practice_id WITH =,
						provider_user_id WITH =,
						tstzrange(start_at, end_at) WITH &&
					)
					WHERE (state <> 'cancelled')
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "appointments_practice_id_start_at_idx" ON "appointments" ("practice_id", "start_at")`,
		);
		await queryRunner.query(
			`CREATE INDEX "appointments_practice_id_provider_user_id_start_at_idx" ON "appointments" ("practice_id", "provider_user_id", "start_at")`,
		);
		await queryRunner.query(
			`CREATE INDEX "appointments_practice_id_patient_id_idx" ON "appointments" ("practice_id", "patient_id")`,
		);
		await queryRunner.query(`
			CREATE TABLE "audit_events" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"actor_user_id" uuid NOT NULL,
				"action" character varying(80) NOT NULL,
				"resource_type" character varying(80) NOT NULL,
				"resource_id" uuid,
				"correlation_id" character varying(128) NOT NULL,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "audit_events_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "audit_events_actor_user_id_fkey"
					FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "audit_events_practice_id_created_at_idx" ON "audit_events" ("practice_id", "created_at")`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS "audit_events"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
	}
}
