import {type MigrationInterface, type QueryRunner} from 'typeorm';

export class PatientDemographics1760000000002 implements MigrationInterface {
	name = 'PatientDemographics1760000000002';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "patients"
				ADD "date_of_birth" character varying(10) NOT NULL DEFAULT '1980-01-01',
				ADD "gender" character varying(20) NOT NULL DEFAULT 'female',
				ADD "status" character varying(20) NOT NULL DEFAULT 'active',
				ADD "phone" character varying(40) NOT NULL DEFAULT '555-0100',
				ADD "email" character varying(320) NOT NULL DEFAULT 'synthetic.patient@example.test',
				ADD "street" character varying(200) NOT NULL DEFAULT '100 Demo Street',
				ADD "city" character varying(100) NOT NULL DEFAULT 'Harborview',
				ADD "state" character varying(100) NOT NULL DEFAULT 'WA',
				ADD "postal_code" character varying(20) NOT NULL DEFAULT '98101',
				ADD "emergency_contact_name" character varying(100) NOT NULL DEFAULT 'Synthetic Contact',
				ADD "emergency_contact_relationship" character varying(100) NOT NULL DEFAULT 'Sibling',
				ADD "emergency_contact_phone" character varying(40) NOT NULL DEFAULT '555-0101',
				ADD "insurance_provider" character varying(200) NOT NULL DEFAULT 'Synthetic Health Plan',
				ADD "insurance_policy_number" character varying(100) NOT NULL DEFAULT 'SYN-100',
				ADD "insurance_group_number" character varying(100) NOT NULL DEFAULT 'GRP-1',
				ADD "assigned_provider_user_id" uuid,
				ADD "portal_user_id" uuid
		`);
		await queryRunner.query(`
			ALTER TABLE "patients"
				ALTER COLUMN "date_of_birth" DROP DEFAULT,
				ALTER COLUMN "gender" DROP DEFAULT,
				ALTER COLUMN "status" DROP DEFAULT,
				ALTER COLUMN "phone" DROP DEFAULT,
				ALTER COLUMN "email" DROP DEFAULT,
				ALTER COLUMN "street" DROP DEFAULT,
				ALTER COLUMN "city" DROP DEFAULT,
				ALTER COLUMN "state" DROP DEFAULT,
				ALTER COLUMN "postal_code" DROP DEFAULT,
				ALTER COLUMN "emergency_contact_name" DROP DEFAULT,
				ALTER COLUMN "emergency_contact_relationship" DROP DEFAULT,
				ALTER COLUMN "emergency_contact_phone" DROP DEFAULT,
				ALTER COLUMN "insurance_provider" DROP DEFAULT,
				ALTER COLUMN "insurance_policy_number" DROP DEFAULT,
				ALTER COLUMN "insurance_group_number" DROP DEFAULT
		`);
		await queryRunner.query(`
			ALTER TABLE "patients"
				ADD CONSTRAINT "patients_gender_check" CHECK ("gender" IN ('female', 'male', 'non-binary')),
				ADD CONSTRAINT "patients_status_check" CHECK ("status" IN ('active', 'inactive')),
				ADD CONSTRAINT "patients_date_of_birth_check" CHECK ("date_of_birth" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
				ADD CONSTRAINT "patients_assigned_provider_user_id_fkey"
					FOREIGN KEY ("assigned_provider_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
				ADD CONSTRAINT "patients_portal_user_id_fkey"
					FOREIGN KEY ("portal_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
				ADD CONSTRAINT "patients_portal_user_id_key" UNIQUE ("portal_user_id")
		`);
		await queryRunner.query(
			`CREATE INDEX "patients_practice_id_status_idx" ON "patients" ("practice_id", "status")`,
		);
		await queryRunner.query(`
			CREATE TABLE "patient_assignments" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"patient_id" uuid NOT NULL,
				"user_id" uuid NOT NULL,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "patient_assignments_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "patient_assignments_patient_id_user_id_key" UNIQUE ("patient_id", "user_id"),
				CONSTRAINT "patient_assignments_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "patient_assignments_patient_id_fkey"
					FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE,
				CONSTRAINT "patient_assignments_user_id_fkey"
					FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "patient_assignments_practice_id_user_id_idx" ON "patient_assignments" ("practice_id", "user_id")`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS "patient_assignments"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "patients_practice_id_status_idx"`);
		await queryRunner.query(`
			ALTER TABLE "patients"
				DROP CONSTRAINT IF EXISTS "patients_portal_user_id_key",
				DROP CONSTRAINT IF EXISTS "patients_portal_user_id_fkey",
				DROP CONSTRAINT IF EXISTS "patients_assigned_provider_user_id_fkey",
				DROP CONSTRAINT IF EXISTS "patients_date_of_birth_check",
				DROP CONSTRAINT IF EXISTS "patients_status_check",
				DROP CONSTRAINT IF EXISTS "patients_gender_check"
		`);
		await queryRunner.query(`
			ALTER TABLE "patients"
				DROP COLUMN IF EXISTS "portal_user_id",
				DROP COLUMN IF EXISTS "assigned_provider_user_id",
				DROP COLUMN IF EXISTS "insurance_group_number",
				DROP COLUMN IF EXISTS "insurance_policy_number",
				DROP COLUMN IF EXISTS "insurance_provider",
				DROP COLUMN IF EXISTS "emergency_contact_phone",
				DROP COLUMN IF EXISTS "emergency_contact_relationship",
				DROP COLUMN IF EXISTS "emergency_contact_name",
				DROP COLUMN IF EXISTS "postal_code",
				DROP COLUMN IF EXISTS "state",
				DROP COLUMN IF EXISTS "city",
				DROP COLUMN IF EXISTS "street",
				DROP COLUMN IF EXISTS "email",
				DROP COLUMN IF EXISTS "phone",
				DROP COLUMN IF EXISTS "status",
				DROP COLUMN IF EXISTS "gender",
				DROP COLUMN IF EXISTS "date_of_birth"
		`);
	}
}
