import {type MigrationInterface, type QueryRunner} from 'typeorm';

export class Billing1760000000006 implements MigrationInterface {
	name = 'Billing1760000000006';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "invoices" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"patient_id" uuid NOT NULL,
				"status" character varying(32) NOT NULL,
				"amount_cents" integer NOT NULL,
				"currency" character varying(3) NOT NULL DEFAULT 'USD',
				"issued_at" TIMESTAMP WITH TIME ZONE NOT NULL,
				"due_at" TIMESTAMP WITH TIME ZONE NOT NULL,
				"synthetic" boolean NOT NULL DEFAULT true,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "invoices_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "invoices_patient_id_fkey"
					FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT,
				CONSTRAINT "invoices_status_check"
					CHECK ("status" IN ('issued', 'paid')),
				CONSTRAINT "invoices_amount_cents_check"
					CHECK ("amount_cents" > 0)
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "invoices_practice_id_idx" ON "invoices" ("practice_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "invoices_practice_id_patient_id_idx" ON "invoices" ("practice_id", "patient_id")`,
		);

		await queryRunner.query(`
			CREATE TABLE "invoice_line_items" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"invoice_id" uuid NOT NULL,
				"description" character varying(200) NOT NULL,
				"amount_cents" integer NOT NULL,
				CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "invoice_line_items_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "invoice_line_items_invoice_id_fkey"
					FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT,
				CONSTRAINT "invoice_line_items_amount_cents_check"
					CHECK ("amount_cents" > 0)
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "invoice_line_items_practice_id_invoice_id_idx" ON "invoice_line_items" ("practice_id", "invoice_id")`,
		);

		await queryRunner.query(`
			CREATE TABLE "payments" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"invoice_id" uuid NOT NULL,
				"amount_cents" integer NOT NULL,
				"method" character varying(32) NOT NULL,
				"processor_ref" character varying(64) NOT NULL,
				"status" character varying(32) NOT NULL,
				"synthetic" boolean NOT NULL DEFAULT true,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "payments_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "payments_invoice_id_fkey"
					FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT,
				CONSTRAINT "payments_method_check"
					CHECK ("method" IN ('stripe', 'ach')),
				CONSTRAINT "payments_status_check"
					CHECK ("status" IN ('recorded')),
				CONSTRAINT "payments_amount_cents_check"
					CHECK ("amount_cents" > 0)
			)
		`);
		await queryRunner.query(`CREATE INDEX "payments_practice_id_idx" ON "payments" ("practice_id")`);
		await queryRunner.query(
			`CREATE INDEX "payments_practice_id_invoice_id_idx" ON "payments" ("practice_id", "invoice_id")`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "invoice_line_items"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
	}
}
