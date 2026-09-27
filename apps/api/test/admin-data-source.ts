import {DataSource} from 'typeorm';
import {resolveAdminDatabaseUrl, resolveDatabaseUrl} from '../src/persistence/default-database-url.js';
import {postgresConnectionOptions} from '../src/persistence/typeorm.options.js';

export async function createAdminDataSource(): Promise<DataSource> {
	const databaseUrl = resolveAdminDatabaseUrl();
	const dataSource = new DataSource(postgresConnectionOptions(databaseUrl));
	try {
		await dataSource.initialize();
	} catch (error) {
		throw new Error(
			`PostgreSQL is required for API tests. Start it with docker compose up -d. DATABASE_ADMIN_URL=${databaseUrl}`,
			{cause: error},
		);
	}
	await dataSource.runMigrations();
	return dataSource;
}

export async function createAppDataSource(): Promise<DataSource> {
	const databaseUrl = resolveDatabaseUrl();
	const dataSource = new DataSource(postgresConnectionOptions(databaseUrl));
	try {
		await dataSource.initialize();
	} catch (error) {
		throw new Error(
			`PostgreSQL is required for API tests. Start it with docker compose up -d. DATABASE_URL=${databaseUrl}`,
			{cause: error},
		);
	}
	return dataSource;
}
