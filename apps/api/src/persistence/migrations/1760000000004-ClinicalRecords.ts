import {type MigrationInterface, type QueryRunner} from 'typeorm';

export class ClinicalRecords1760000000004 implements MigrationInterface {
	name = 'ClinicalRecords1760000000004';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "clinical_history" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"patient_id" uuid NOT NULL,
				"type" character varying(32) NOT NULL,
				"occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL,
				"title" character varying(200) NOT NULL,
				"summary" character varying(2000) NOT NULL,
				"provider_user_id" uuid NOT NULL,
				"status" character varying(32) NOT NULL,
				"synthetic" boolean NOT NULL DEFAULT true,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "clinical_history_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "clinical_history_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "clinical_history_patient_id_fkey"
					FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT,
				CONSTRAINT "clinical_history_provider_user_id_fkey"
					FOREIGN KEY ("provider_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
				CONSTRAINT "clinical_history_type_check"
					CHECK ("type" IN ('visit', 'consultation', 'procedure')),
				CONSTRAINT "clinical_history_status_check"
					CHECK ("status" IN ('draft', 'completed', 'reviewed', 'amended'))
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "clinical_history_practice_id_patient_id_occurred_at_idx" ON "clinical_history" ("practice_id", "patient_id", "occurred_at")`,
		);

		await queryRunner.query(`
			CREATE TABLE "clinical_conditions" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"patient_id" uuid NOT NULL,
				"display" character varying(200) NOT NULL,
				"clinical_status" character varying(32) NOT NULL,
				"recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL,
				"recorded_by_user_id" uuid NOT NULL,
				"synthetic" boolean NOT NULL DEFAULT true,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "clinical_conditions_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "clinical_conditions_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "clinical_conditions_patient_id_fkey"
					FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT,
				CONSTRAINT "clinical_conditions_recorded_by_user_id_fkey"
					FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
				CONSTRAINT "clinical_conditions_clinical_status_check"
					CHECK ("clinical_status" IN ('active', 'resolved', 'inactive'))
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "clinical_conditions_practice_id_patient_id_recorded_at_idx" ON "clinical_conditions" ("practice_id", "patient_id", "recorded_at")`,
		);

		await queryRunner.query(`
			CREATE TABLE "vitals" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"patient_id" uuid NOT NULL,
				"recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL,
				"systolic_mm_hg" integer NOT NULL,
				"diastolic_mm_hg" integer NOT NULL,
				"heart_rate_bpm" integer NOT NULL,
				"temperature_c" double precision NOT NULL,
				"respiratory_rate" integer NOT NULL,
				"spo2_percent" integer NOT NULL,
				"weight_kg" double precision NOT NULL,
				"recorded_by_user_id" uuid NOT NULL,
				"synthetic" boolean NOT NULL DEFAULT true,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "vitals_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "vitals_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "vitals_patient_id_fkey"
					FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT,
				CONSTRAINT "vitals_recorded_by_user_id_fkey"
					FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "vitals_practice_id_patient_id_recorded_at_idx" ON "vitals" ("practice_id", "patient_id", "recorded_at")`,
		);

		await queryRunner.query(`
			CREATE TABLE "medications" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"patient_id" uuid NOT NULL,
				"name" character varying(200) NOT NULL,
				"dosage" character varying(100) NOT NULL,
				"frequency" character varying(100) NOT NULL,
				"route" character varying(100) NOT NULL,
				"start_date" character varying(10) NOT NULL,
				"end_date" character varying(10),
				"prescriber_user_id" uuid NOT NULL,
				"instructions" character varying(500) NOT NULL,
				"status" character varying(32) NOT NULL,
				"synthetic" boolean NOT NULL DEFAULT true,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "medications_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "medications_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "medications_patient_id_fkey"
					FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT,
				CONSTRAINT "medications_prescriber_user_id_fkey"
					FOREIGN KEY ("prescriber_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
				CONSTRAINT "medications_status_check"
					CHECK ("status" IN ('active', 'discontinued', 'completed')),
				CONSTRAINT "medications_start_date_check"
					CHECK ("start_date" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
				CONSTRAINT "medications_end_date_check"
					CHECK ("end_date" IS NULL OR "end_date" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "medications_practice_id_patient_id_start_date_idx" ON "medications" ("practice_id", "patient_id", "start_date")`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS "medications"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "vitals"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "clinical_conditions"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "clinical_history"`);
	}
}
