import {type MigrationInterface, type QueryRunner} from 'typeorm';

const APP_ROLE = 'medconnect_app';
const APP_PASSWORD = 'medconnect_app';

const IDENTITY_TABLES = ['users', 'auth_sessions', 'practice_memberships'] as const;

const RLS_TABLES = [
	'practices',
	'patients',
	'patient_assignments',
	'appointments',
	'clinical_history',
	'clinical_conditions',
	'vitals',
	'medications',
	'telehealth_sessions',
	'invoices',
	'invoice_line_items',
	'payments',
	'audit_events',
] as const;

export class TenantRowLevelSecurity1760000000007 implements MigrationInterface {
	name = 'TenantRowLevelSecurity1760000000007';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			DO $$
			BEGIN
				IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${APP_ROLE}') THEN
					CREATE ROLE ${APP_ROLE} LOGIN PASSWORD '${APP_PASSWORD}'
						NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
				END IF;
			END
			$$;
		`);
		await queryRunner.query(`
			DO $$
			BEGIN
				EXECUTE format('GRANT CONNECT ON DATABASE %I TO ${APP_ROLE}', current_database());
			END
			$$;
		`);
		await queryRunner.query(`GRANT USAGE ON SCHEMA public TO ${APP_ROLE}`);

		const dmlTables = [...IDENTITY_TABLES, ...RLS_TABLES];
		await queryRunner.query(
			`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ${quotedList(dmlTables)} TO ${APP_ROLE}`,
		);

		for (const table of RLS_TABLES) {
			await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
			const column = table === 'practices' ? 'id' : 'practice_id';
			await queryRunner.query(`
				CREATE POLICY "${table}_tenant_isolation" ON "${table}"
				USING (
					"${column}" = NULLIF(current_setting('app.current_practice_id', true), '')::uuid
				)
				WITH CHECK (
					"${column}" = NULLIF(current_setting('app.current_practice_id', true), '')::uuid
				)
			`);
		}
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		for (const table of RLS_TABLES) {
			await queryRunner.query(`DROP POLICY IF EXISTS "${table}_tenant_isolation" ON "${table}"`);
			await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
		}

		const dmlTables = [...IDENTITY_TABLES, ...RLS_TABLES];
		await queryRunner.query(
			`REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE ${quotedList(dmlTables)} FROM ${APP_ROLE}`,
		);
		await queryRunner.query(`REVOKE USAGE ON SCHEMA public FROM ${APP_ROLE}`);
		await queryRunner.query(`
			DO $$
			BEGIN
				EXECUTE format('REVOKE CONNECT ON DATABASE %I FROM ${APP_ROLE}', current_database());
			END
			$$;
		`);
		await queryRunner.query(`DROP ROLE IF EXISTS ${APP_ROLE}`);
	}
}

function quotedList(tables: readonly string[]): string {
	return tables.map((table) => `"${table}"`).join(', ');
}
