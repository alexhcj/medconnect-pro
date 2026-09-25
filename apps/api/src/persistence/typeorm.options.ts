import type {DataSourceOptions} from 'typeorm';
import {persistenceEntities} from './entities/index.js';
import {Appointments1760000000003} from './migrations/1760000000003-Appointments.js';
import {AuthSessions1760000000001} from './migrations/1760000000001-AuthSessions.js';
import {ClinicalRecords1760000000004} from './migrations/1760000000004-ClinicalRecords.js';
import {InitialTenantModel1760000000000} from './migrations/1760000000000-InitialTenantModel.js';
import {PatientDemographics1760000000002} from './migrations/1760000000002-PatientDemographics.js';

export function postgresConnectionOptions(databaseUrl: string): DataSourceOptions {
	return {
		type: 'postgres',
		url: databaseUrl,
		entities: persistenceEntities,
		migrations: [
			InitialTenantModel1760000000000,
			AuthSessions1760000000001,
			PatientDemographics1760000000002,
			Appointments1760000000003,
			ClinicalRecords1760000000004,
		],
		synchronize: false,
		migrationsRun: false,
		logging: false,
	};
}
