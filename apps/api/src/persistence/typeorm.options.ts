import type {DataSourceOptions} from 'typeorm';
import {persistenceEntities} from './entities/index.js';
import {AuthSessions1760000000001} from './migrations/1760000000001-AuthSessions.js';
import {InitialTenantModel1760000000000} from './migrations/1760000000000-InitialTenantModel.js';

export function postgresConnectionOptions(databaseUrl: string): DataSourceOptions {
	return {
		type: 'postgres',
		url: databaseUrl,
		entities: persistenceEntities,
		migrations: [InitialTenantModel1760000000000, AuthSessions1760000000001],
		synchronize: false,
		migrationsRun: false,
		logging: false,
	};
}
