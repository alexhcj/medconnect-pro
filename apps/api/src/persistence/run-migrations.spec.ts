import {describe, expect, it, vi} from 'vitest';
import {DEFAULT_DATABASE_ADMIN_URL, DEFAULT_DATABASE_URL} from './default-database-url.js';
import {parseMigrationMode, runHostedMigrations} from './run-migrations.js';

const hostedRuntimeUrl =
	'postgresql://medconnect_app:hosted-runtime-secret@preview-db.example.internal:5432/medconnect';
const hostedAdminUrl =
	'postgresql://medconnect:hosted-admin-secret@preview-db.example.internal:5432/medconnect';

function hostedEnv(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
	return {
		APP_ENV: 'production',
		NODE_ENV: 'production',
		DATABASE_URL: hostedRuntimeUrl.replace('preview-db', 'prod-db'),
		DATABASE_ADMIN_URL: hostedAdminUrl.replace('preview-db', 'prod-db'),
		DOCUMENT_S3_BUCKET: 'medconnect-production-documents-example',
		WEB_ORIGINS: 'https://demo.amplifyapp.com',
		RATE_LIMIT_KEY_SECRET: 'hosted-rate-limit-key-secret-example-0001',
		...overrides,
	};
}

function mockDataSource() {
	const ds = {
		isInitialized: false,
		initialize: vi.fn(async () => {
			ds.isInitialized = true;
		}),
		runMigrations: vi.fn(async () => [{name: 'Example'}]),
		undoLastMigration: vi.fn(async () => undefined),
		destroy: vi.fn(async () => {
			ds.isInitialized = false;
		}),
	};
	return ds;
}

describe('parseMigrationMode', () => {
	it('defaults to run and requires --revert for undo', () => {
		expect(parseMigrationMode([])).toBe('run');
		expect(parseMigrationMode(['--dry-run'])).toBe('run');
		expect(parseMigrationMode(['--revert'])).toBe('revert');
	});
});

describe('runHostedMigrations', () => {
	it('refuses hosted Compose URLs before connecting', async () => {
		const createDataSource = vi.fn();
		await expect(
			runHostedMigrations({
				env: hostedEnv({
					DATABASE_URL: DEFAULT_DATABASE_URL,
					DATABASE_ADMIN_URL: DEFAULT_DATABASE_ADMIN_URL,
				}),
				createDataSource,
			}),
		).rejects.toThrow(/Compose credentials|required when APP_ENV/i);
		expect(createDataSource).not.toHaveBeenCalled();
	});

	it('runs migrations against the admin URL after fail-closed parse', async () => {
		const ds = mockDataSource();
		const createDataSource = vi.fn(() => ds);
		await runHostedMigrations({env: hostedEnv(), createDataSource});
		expect(createDataSource).toHaveBeenCalledWith(hostedEnv().DATABASE_ADMIN_URL);
		expect(ds.initialize).toHaveBeenCalledOnce();
		expect(ds.runMigrations).toHaveBeenCalledOnce();
		expect(ds.undoLastMigration).not.toHaveBeenCalled();
		expect(ds.destroy).toHaveBeenCalledOnce();
	});

	it('undoes the last migration only in revert mode', async () => {
		const ds = mockDataSource();
		await runHostedMigrations({
			env: hostedEnv(),
			mode: 'revert',
			createDataSource: () => ds,
		});
		expect(ds.undoLastMigration).toHaveBeenCalledOnce();
		expect(ds.runMigrations).not.toHaveBeenCalled();
	});
});
