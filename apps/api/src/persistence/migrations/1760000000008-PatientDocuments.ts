import {type MigrationInterface, type QueryRunner} from 'typeorm';

const APP_ROLE = 'medconnect_app';
const TABLE = 'patient_documents';

export class PatientDocuments1760000000008 implements MigrationInterface {
	name = 'PatientDocuments1760000000008';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "${TABLE}" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"patient_id" uuid NOT NULL,
				"name" character varying(200) NOT NULL,
				"content_type" character varying(64) NOT NULL,
				"category" character varying(32) NOT NULL,
				"size_bytes" integer NOT NULL,
				"storage_key" character varying(500) NOT NULL,
				"uploaded_by_user_id" uuid NOT NULL,
				"synthetic" boolean NOT NULL DEFAULT true,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "patient_documents_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "patient_documents_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "patient_documents_patient_id_fkey"
					FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT,
				CONSTRAINT "patient_documents_uploaded_by_user_id_fkey"
					FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
				CONSTRAINT "patient_documents_category_check"
					CHECK ("category" IN ('intake', 'insurance', 'clinical')),
				CONSTRAINT "patient_documents_content_type_check"
					CHECK ("content_type" IN ('application/pdf', 'image/png', 'image/jpeg')),
				CONSTRAINT "patient_documents_size_bytes_check"
					CHECK ("size_bytes" > 0)
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "patient_documents_practice_id_patient_id_created_at_idx" ON "${TABLE}" ("practice_id", "patient_id", "created_at")`,
		);

		await queryRunner.query(
			`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "${TABLE}" TO ${APP_ROLE}`,
		);
		await queryRunner.query(`ALTER TABLE "${TABLE}" ENABLE ROW LEVEL SECURITY`);
		await queryRunner.query(`
			CREATE POLICY "${TABLE}_tenant_isolation" ON "${TABLE}"
			USING (
				"practice_id" = NULLIF(current_setting('app.current_practice_id', true), '')::uuid
			)
			WITH CHECK (
				"practice_id" = NULLIF(current_setting('app.current_practice_id', true), '')::uuid
			)
		`);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP POLICY IF EXISTS "${TABLE}_tenant_isolation" ON "${TABLE}"`);
		await queryRunner.query(`ALTER TABLE "${TABLE}" DISABLE ROW LEVEL SECURITY`);
		await queryRunner.query(
			`REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE "${TABLE}" FROM ${APP_ROLE}`,
		);
		await queryRunner.query(`DROP TABLE IF EXISTS "${TABLE}"`);
	}
}
