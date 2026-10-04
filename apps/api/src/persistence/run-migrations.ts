import path from 'node:path';
import {Logger} from '@nestjs/common';
import {DataSource} from 'typeorm';
import {envSchema} from '../platform/env.schema.js';
import {postgresConnectionOptions} from './typeorm.options.js';

export type MigrationMode = 'run' | 'revert';

export type MigrationDataSource = {
	isInitialized: boolean;
	initialize(): Promise<unknown>;
	runMigrations(): Promise<unknown[] | unknown>;
	undoLastMigration(): Promise<unknown>;
	destroy(): Promise<unknown>;
};

export function parseMigrationMode(argv: readonly string[]): MigrationMode {
	return argv.includes('--revert') ? 'revert' : 'run';
}

export function parseMigrationEnv(env: NodeJS.ProcessEnv = process.env) {
	return envSchema.parse(env);
}

export async function runHostedMigrations(options: {
	env?: NodeJS.ProcessEnv;
	mode?: MigrationMode;
	createDataSource?: (adminUrl: string) => MigrationDataSource;
}): Promise<void> {
	const parsed = parseMigrationEnv(options.env);
	const mode = options.mode ?? 'run';
	const dataSource =
		options.createDataSource?.(parsed.DATABASE_ADMIN_URL) ??
		new DataSource(postgresConnectionOptions(parsed.DATABASE_ADMIN_URL));

	await dataSource.initialize();
	try {
		if (mode === 'revert') {
			await dataSource.undoLastMigration();
			Logger.log('Reverted the last TypeORM migration', 'RunMigrations');
			return;
		}
		const executed = await dataSource.runMigrations();
		const count = Array.isArray(executed) ? executed.length : 0;
		Logger.log(
			count === 0 ? 'No pending TypeORM migrations' : `Applied ${count} TypeORM migration(s)`,
			'RunMigrations',
		);
	} finally {
		if (dataSource.isInitialized) {
			await dataSource.destroy();
		}
	}
}

function isCliEntrypoint(): boolean {
	const entry = process.argv[1];
	if (!entry) {
		return false;
	}
	return path.basename(entry).replace(/\.ts$/, '.js') === 'run-migrations.js';
}

if (isCliEntrypoint()) {
	runHostedMigrations({mode: parseMigrationMode(process.argv.slice(2))}).catch((error: unknown) => {
		Logger.error(error instanceof Error ? error.message : String(error), 'RunMigrations');
		process.exitCode = 1;
	});
}
