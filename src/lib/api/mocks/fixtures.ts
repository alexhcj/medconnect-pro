import patientsFixture from '@docs/mocks/patients.json';
import providersFixture from '@docs/mocks/providers.json';
import medicationsFixture from '@docs/mocks/medications.json';
import vitalsFixture from '@docs/mocks/vitals.json';
import historyFixture from '@docs/mocks/history.json';
import documentsFixture from '@docs/mocks/documents.json';
import {Patient} from '@/types/medical/patient';
import {Provider} from '@/types/medical/provider';
import {Medication} from '@/types/medical/medication';
import {Vital} from '@/types/medical/vital';
import {HistoryEntry} from '@/types/medical/history';
import {PatientDocument} from '@/types/medical/document';

export const fixturePatients = patientsFixture.patients as Patient[];
export const fixtureProviders = providersFixture.providers as Provider[];
export const fixtureMedications = medicationsFixture.medications as Medication[];
export const fixtureVitals = vitalsFixture.vitals as Vital[];
export const fixtureHistory = historyFixture.history as HistoryEntry[];
export const fixtureDocuments = documentsFixture.documents as PatientDocument[];
