import {Patient} from '@/types/medical/patient';
import {Medication} from '@/types/medical/medication';
import {Vital} from '@/types/medical/vital';
import {HistoryEntry} from '@/types/medical/history';
import {PatientDocument} from '@/types/medical/document';
import {Provider} from '@/types/medical/provider';
import {
	fixtureDocuments,
	fixtureHistory,
	fixtureMedications,
	fixturePatients,
	fixtureProviders,
	fixtureVitals,
} from '@/lib/api/mocks/fixtures';
import {mockDelay, mockLog, shouldSimulateError} from '@/lib/api/mocks/runtime';

const PAGE_SIZE = 10;

const patients: Patient[] = structuredClone(fixturePatients);
const medications: Medication[] = structuredClone(fixtureMedications);
const vitals: Vital[] = structuredClone(fixtureVitals);
const history: HistoryEntry[] = structuredClone(fixtureHistory);
const documents: PatientDocument[] = structuredClone(fixtureDocuments);
const providers: Provider[] = structuredClone(fixtureProviders);

async function withMock<T>(work: () => T, errorMessage: string): Promise<T> {
	await mockDelay();
	if (shouldSimulateError()) {
		mockLog('warn', errorMessage);
		throw new Error(errorMessage);
	}
	return work();
}

function paginatePatients(query?: string, pageParam?: string | number) {
	const page = Number(pageParam ?? 1) || 1;
	const normalized = query?.trim().toLowerCase() ?? '';
	const filtered = normalized
		? patients.filter((patient) => {
			const haystack = [
				patient.firstName,
				patient.lastName,
				patient.email,
				patient.phone,
				patient.id,
			]
				.join(' ')
				.toLowerCase();
			return haystack.includes(normalized);
		})
		: patients;

	const start = (page - 1) * PAGE_SIZE;
	const slice = filtered.slice(start, start + PAGE_SIZE);
	const hasMore = start + PAGE_SIZE < filtered.length;

	return {
		patients: slice,
		nextPage: hasMore ? page + 1 : undefined,
		hasMore,
	};
}

function requirePatient(patientId: string): Patient {
	const patient = patients.find((item) => item.id === patientId);
	if (!patient) {
		throw new Error(`Mock: Patient with id "${patientId}" not found`);
	}
	return patient;
}

export const medicalMockAPI = {
	listPatients: async ({pageParam, query}: {pageParam?: string | number; query?: string} = {}) =>
		withMock(() => paginatePatients(query, pageParam), 'Mock: Failed to list patients'),

	searchPatients: async ({pageParam, query}: {pageParam?: string | number; query?: string}) =>
		withMock(() => paginatePatients(query, pageParam), 'Mock: Failed to search patients'),

	getPatient: async (patientId: string): Promise<Patient> =>
		withMock(() => requirePatient(patientId), 'Mock: Failed to fetch patient'),

	updatePatient: async (patientId: string, updates: Partial<Patient>): Promise<Patient> =>
		withMock(() => {
			const index = patients.findIndex((item) => item.id === patientId);
			if (index === -1) {
				throw new Error(`Mock: Patient with id "${patientId}" not found`);
			}

			patients[index] = {
				...patients[index],
				...updates,
				id: patients[index].id,
				synthetic: true,
			};
			mockLog('info', 'Updated patient', patientId);
			return patients[index];
		}, 'Mock: Failed to update patient'),

	getPatientHistory: async (patientId: string): Promise<HistoryEntry[]> =>
		withMock(() => {
			requirePatient(patientId);
			return history.filter((entry) => entry.patientId === patientId);
		}, 'Mock: Failed to fetch patient history'),

	getPatientVitals: async (patientId: string): Promise<Vital[]> =>
		withMock(() => {
			requirePatient(patientId);
			return vitals.filter((entry) => entry.patientId === patientId);
		}, 'Mock: Failed to fetch patient vitals'),

	getPatientMedications: async (patientId: string): Promise<Medication[]> =>
		withMock(() => {
			requirePatient(patientId);
			return medications.filter((entry) => entry.patientId === patientId);
		}, 'Mock: Failed to fetch patient medications'),

	getPatientDocuments: async (patientId: string): Promise<PatientDocument[]> =>
		withMock(() => {
			requirePatient(patientId);
			return documents.filter((entry) => entry.patientId === patientId);
		}, 'Mock: Failed to fetch patient documents'),

	getProvider: async (providerId: string): Promise<Provider> =>
		withMock(() => {
			const provider = providers.find((item) => item.id === providerId);
			if (!provider) {
				throw new Error(`Mock: Provider with id "${providerId}" not found`);
			}
			return provider;
		}, 'Mock: Failed to fetch provider'),
};
