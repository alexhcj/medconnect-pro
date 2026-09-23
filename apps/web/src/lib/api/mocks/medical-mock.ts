import {ApiError, ApiErrorDetail} from '@/lib/api/http';
import {Patient, PatientDemographicsInput} from '@/types/medical/patient';
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

type PatientStatusFilter = 'active' | 'inactive' | 'all';
type PatientNameSort = 'name-asc' | 'name-desc';

function compareByName(a: Patient, b: Patient, direction: 1 | -1) {
	const last = a.lastName.localeCompare(b.lastName, 'en');
	if (last !== 0) {
		return last * direction;
	}
	return a.firstName.localeCompare(b.firstName, 'en') * direction;
}

function paginatePatients(
	query?: string,
	pageParam?: string | number,
	status?: PatientStatusFilter,
	sort?: PatientNameSort,
) {
	const page = Number(pageParam ?? 1) || 1;
	const normalized = query?.trim().toLowerCase() ?? '';
	let filtered = normalized
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
		: patients.slice();

	if (status && status !== 'all') {
		filtered = filtered.filter((patient) => patient.status === status);
	}

	if (sort === 'name-asc' || sort === 'name-desc') {
		const direction = sort === 'name-desc' ? -1 : 1;
		filtered = [...filtered].sort((a, b) => compareByName(a, b, direction));
	}

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
		throw new ApiError('Patient not found', 404, {code: 'NOT_FOUND'});
	}
	return patient;
}

function validationError(details: ApiErrorDetail[]): never {
	throw new ApiError('Request validation failed', 400, {code: 'VALIDATION_ERROR', details});
}

function assertKnownProvider(providerId: string) {
	if (!providers.some((provider) => provider.id === providerId)) {
		validationError([{path: 'providerId', message: 'Assigned provider is not available'}]);
	}
}

function assertUniqueEmail(email: string, exceptId?: string) {
	const normalized = email.trim().toLowerCase();
	const clash = patients.find(
		(patient) => patient.id !== exceptId && patient.email.trim().toLowerCase() === normalized,
	);
	if (clash) {
		validationError([{path: 'email', message: 'A patient with this email already exists'}]);
	}
}

function requireDemographics(input: PatientDemographicsInput) {
	const details: ApiErrorDetail[] = [];
	const required: Array<[string, string | undefined, string]> = [
		['firstName', input.firstName, 'First name is required'],
		['lastName', input.lastName, 'Last name is required'],
		['dateOfBirth', input.dateOfBirth, 'Date of birth is required'],
		['gender', input.gender, 'Gender is required'],
		['phone', input.phone, 'Phone is required'],
		['email', input.email, 'Email is required'],
		['providerId', input.providerId, 'Assigned provider is required'],
		['address.street', input.address?.street, 'Street is required'],
		['address.city', input.address?.city, 'City is required'],
		['address.state', input.address?.state, 'State is required'],
		['address.postalCode', input.address?.postalCode, 'Postal code is required'],
		['emergencyContact.name', input.emergencyContact?.name, 'Emergency contact name is required'],
		['emergencyContact.relationship', input.emergencyContact?.relationship, 'Relationship is required'],
		['emergencyContact.phone', input.emergencyContact?.phone, 'Emergency phone is required'],
		['insurance.provider', input.insurance?.provider, 'Insurance provider is required'],
		['insurance.policyNumber', input.insurance?.policyNumber, 'Policy number is required'],
		['insurance.groupNumber', input.insurance?.groupNumber, 'Group number is required'],
	];

	for (const [path, value, message] of required) {
		if (!value?.trim()) {
			details.push({path, message});
		}
	}

	if (input.status !== 'active' && input.status !== 'inactive') {
		details.push({path: 'status', message: 'Status is required'});
	}

	if (details.length > 0) {
		validationError(details);
	}
}

function nextPatientId() {
	const max = patients.reduce((highest, patient) => {
		const match = /^demo-patient-(\d+)$/.exec(patient.id);
		return match ? Math.max(highest, Number(match[1])) : highest;
	}, 0);
	return `demo-patient-${String(max + 1).padStart(3, '0')}`;
}

function demoPracticeId() {
	return patients[0]?.practiceId ?? 'demo-practice-001';
}

const WRITABLE_KEYS = [
	'firstName',
	'lastName',
	'dateOfBirth',
	'gender',
	'status',
	'phone',
	'email',
	'address',
	'emergencyContact',
	'insurance',
	'providerId',
] as const;

function pickWritable(updates: Partial<Patient>): Partial<Patient> {
	const next: Partial<Patient> = {};
	for (const key of WRITABLE_KEYS) {
		if (updates[key] !== undefined) {
			Object.assign(next, {[key]: updates[key]});
		}
	}
	return next;
}

export const medicalMockAPI = {
	listPatients: async ({
		pageParam,
		query,
		status,
		sort,
	}: {
		pageParam?: string | number;
		query?: string;
		status?: PatientStatusFilter;
		sort?: PatientNameSort;
	} = {}) => withMock(() => paginatePatients(query, pageParam, status, sort), 'Mock: Failed to list patients'),

	searchPatients: async ({
		pageParam,
		query,
		status,
		sort,
	}: {
		pageParam?: string | number;
		query?: string;
		status?: PatientStatusFilter;
		sort?: PatientNameSort;
	}) => withMock(() => paginatePatients(query, pageParam, status, sort), 'Mock: Failed to search patients'),

	getPatient: async (patientId: string): Promise<Patient> =>
		withMock(() => requirePatient(patientId), 'Mock: Failed to fetch patient'),

	createPatient: async (input: PatientDemographicsInput): Promise<Patient> =>
		withMock(() => {
			requireDemographics(input);
			assertUniqueEmail(input.email);
			assertKnownProvider(input.providerId);

			const created: Patient = {
				id: nextPatientId(),
				firstName: input.firstName.trim(),
				lastName: input.lastName.trim(),
				dateOfBirth: input.dateOfBirth,
				gender: input.gender,
				status: input.status,
				phone: input.phone.trim(),
				email: input.email.trim(),
				address: {...input.address},
				emergencyContact: {...input.emergencyContact},
				insurance: {...input.insurance},
				practiceId: demoPracticeId(),
				providerId: input.providerId,
				conditions: [],
				synthetic: true,
			};
			patients.push(created);
			mockLog('info', 'Created patient', created.id);
			return created;
		}, 'Mock: Failed to create patient'),

	updatePatient: async (patientId: string, updates: Partial<Patient>): Promise<Patient> =>
		withMock(() => {
			const index = patients.findIndex((item) => item.id === patientId);
			if (index === -1) {
				throw new ApiError('Patient not found', 404, {code: 'NOT_FOUND'});
			}

			const writable = pickWritable(updates);
			if (typeof writable.email === 'string') {
				assertUniqueEmail(writable.email, patientId);
			}
			if (typeof writable.providerId === 'string') {
				assertKnownProvider(writable.providerId);
			}

			const current = patients[index];
			patients[index] = {
				...current,
				...writable,
				id: current.id,
				practiceId: current.practiceId,
				conditions: current.conditions,
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

	listProviders: async (): Promise<Provider[]> =>
		withMock(() => providers.map((provider) => ({...provider})), 'Mock: Failed to list providers'),

	getProvider: async (providerId: string): Promise<Provider> =>
		withMock(() => {
			const provider = providers.find((item) => item.id === providerId);
			if (!provider) {
				throw new Error(`Mock: Provider with id "${providerId}" not found`);
			}
			return provider;
		}, 'Mock: Failed to fetch provider'),
};
