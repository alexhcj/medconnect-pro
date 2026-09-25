import dashboardFixture from '@docs/mocks/dashboard.json';
import demoUsersFixture from '@docs/mocks/demo-users.json';
import patientsFixture from '@docs/mocks/patients.json';
import providersFixture from '@docs/mocks/providers.json';
import medicationsFixture from '@docs/mocks/medications.json';
import vitalsFixture from '@docs/mocks/vitals.json';
import historyFixture from '@docs/mocks/history.json';
import conditionsFixture from '@docs/mocks/conditions.json';
import documentsFixture from '@docs/mocks/documents.json';
import appointmentsFixture from '@docs/mocks/appointments.json';
import {Appointment} from '@/types/medical/appointment';
import {Patient} from '@/types/medical/patient';
import {Provider} from '@/types/medical/provider';
import {ClinicalCondition} from '@/types/medical/clinical-condition';
import {Medication} from '@/types/medical/medication';
import {Vital} from '@/types/medical/vital';
import {HistoryEntry} from '@/types/medical/history';
import {PatientDocument} from '@/types/medical/document';
import {DashboardMetric} from '@/types/dashboard/overview';
import type {Role} from '@/types/auth/roles';

export interface DemoUserFixture {
	email: string;
	password: string;
	role: Role;
	userId: string;
}

export const fixtureDemoUsers = demoUsersFixture.users as DemoUserFixture[];
export const fixturePatients = patientsFixture.patients as Patient[];
export const fixtureProviders = providersFixture.providers as Provider[];
export const fixtureMedications = medicationsFixture.medications as Medication[];
export const fixtureVitals = vitalsFixture.vitals as Vital[];
export const fixtureHistory = historyFixture.history as HistoryEntry[];
export const fixtureConditions = conditionsFixture.conditions as ClinicalCondition[];
export const fixtureDocuments = documentsFixture.documents as PatientDocument[];
export const fixtureAppointments = appointmentsFixture.appointments as Array<
	Omit<Appointment, 'patientName' | 'providerName'>
>;
export const fixtureDashboardMetrics = dashboardFixture.metrics as DashboardMetric[];
