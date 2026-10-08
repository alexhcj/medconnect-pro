import type {TlsOptions} from 'node:tls';
import type {DataSourceOptions} from 'typeorm';
import {persistenceEntities} from './entities/index.js';
import {Appointments1760000000003} from './migrations/1760000000003-Appointments.js';
import {AuthSessions1760000000001} from './migrations/1760000000001-AuthSessions.js';
import {ClinicalRecords1760000000004} from './migrations/1760000000004-ClinicalRecords.js';
import {InitialTenantModel1760000000000} from './migrations/1760000000000-InitialTenantModel.js';
import {PatientDemographics1760000000002} from './migrations/1760000000002-PatientDemographics.js';
import {Billing1760000000006} from './migrations/1760000000006-Billing.js';
import {TelehealthSessions1760000000005} from './migrations/1760000000005-TelehealthSessions.js';
import {TenantRowLevelSecurity1760000000007} from './migrations/1760000000007-TenantRowLevelSecurity.js';
import {PatientDocuments1760000000008} from './migrations/1760000000008-PatientDocuments.js';
import {Notifications1760000000009} from './migrations/1760000000009-Notifications.js';
import {TelehealthDailyRoom1760000000010} from './migrations/1760000000010-TelehealthDailyRoom.js';
import {TenantRlsSubscriber} from './tenant-rls.subscriber.js';

function tunnelTlsOptions(): TlsOptions | undefined {
	const servername = process.env.RDS_TLS_SERVERNAME;
	if (!servername) {
		return undefined;
	}
	return {
		rejectUnauthorized: true,
		servername,
	} as TlsOptions;
}

export function postgresConnectionOptions(databaseUrl: string): DataSourceOptions {
	const ssl = tunnelTlsOptions();
	return {
		type: 'postgres',
		url: databaseUrl,
		...(ssl ? {ssl} : {}),
		entities: persistenceEntities,
		subscribers: [TenantRlsSubscriber],
		migrations: [
			InitialTenantModel1760000000000,
			AuthSessions1760000000001,
			PatientDemographics1760000000002,
			Appointments1760000000003,
			ClinicalRecords1760000000004,
			TelehealthSessions1760000000005,
			Billing1760000000006,
			TenantRowLevelSecurity1760000000007,
			PatientDocuments1760000000008,
			Notifications1760000000009,
			TelehealthDailyRoom1760000000010,
		],
		synchronize: false,
		migrationsRun: false,
		logging: false,
	};
}
