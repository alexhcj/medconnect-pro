import {type MigrationInterface, type QueryRunner} from 'typeorm';

export class InitialTenantModel1760000000000 implements MigrationInterface {
	name = 'InitialTenantModel1760000000000';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "practices" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"name" character varying(200) NOT NULL,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "practices_pkey" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query(`
			CREATE TABLE "users" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"email" character varying(320) NOT NULL,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "users_email_key" UNIQUE ("email")
			)
		`);
		await queryRunner.query(`
			CREATE TABLE "practice_memberships" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"user_id" uuid NOT NULL,
				"role" character varying(32) NOT NULL,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "practice_memberships_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "practice_memberships_practice_id_user_id_key" UNIQUE ("practice_id", "user_id"),
				CONSTRAINT "practice_memberships_role_check" CHECK (
					"role" IN (
						'SUPER_ADMIN',
						'PRACTICE_ADMIN',
						'PROVIDER',
						'NURSE',
						'RECEPTIONIST',
						'PATIENT'
					)
				),
				CONSTRAINT "practice_memberships_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT,
				CONSTRAINT "practice_memberships_user_id_fkey"
					FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "practice_memberships_practice_id_idx" ON "practice_memberships" ("practice_id")`,
		);
		await queryRunner.query(`
			CREATE TABLE "patients" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"practice_id" uuid NOT NULL,
				"first_name" character varying(100) NOT NULL,
				"last_name" character varying(100) NOT NULL,
				"synthetic" boolean NOT NULL DEFAULT true,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "patients_pkey" PRIMARY KEY ("id"),
				CONSTRAINT "patients_practice_id_fkey"
					FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "patients_practice_id_idx" ON "patients" ("practice_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "patients_practice_id_last_name_idx" ON "patients" ("practice_id", "last_name")`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS "patients"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "practice_memberships"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "practices"`);
	}
}
