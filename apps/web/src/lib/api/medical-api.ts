import {Appointment, AppointmentCreateInput} from '@/types/medical/appointment';
import {Patient, PatientDemographicsInput} from '@/types/medical/patient';
import {ClinicalCondition} from '@/types/medical/clinical-condition';
import {Medication} from '@/types/medical/medication';
import {Vital} from '@/types/medical/vital';
import {HistoryEntry} from '@/types/medical/history';
import {PatientDocument} from '@/types/medical/document';
import {Provider} from '@/types/medical/provider';
import {toast} from 'react-hot-toast';
import {ApiError, apiFetch} from '@/lib/api/http';
import {liveDemoProvider} from '@/lib/api/live-demo-provider';
import {medicalMockAPI} from '@/lib/api/mocks/medical-mock';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {nestApiBaseUrl} from '@/lib/api/nest-api';
import {
	appointmentFromRdo,
	type AppointmentRdo,
	type AppointmentSearchResultRdo,
} from '@/lib/api/appointment-rdo';
import {
	conditionFromRdo,
	historyFromRdo,
	medicationFromRdo,
	vitalFromRdo,
	type ConditionListRdo,
	type HistoryListRdo,
	type MedicationListRdo,
	type VitalListRdo,
} from '@/lib/api/clinical-rdo';
import {patientFromRdo, type PatientRdo, type PatientSearchResultRdo} from '@/lib/api/patient-rdo';

export type PatientStatusFilter = 'active' | 'inactive' | 'all';

export type PatientNameSort = 'name-asc' | 'name-desc';

export interface PatientSearchParams {
	pageParam?: string | number;
	query?: string;
	status?: PatientStatusFilter;
	sort?: PatientNameSort;
}

export interface PatientSearchResult {
	patients: Patient[];
	nextPage?: number;
	hasMore: boolean;
}

export type {PatientDemographicsInput};

function patientsUrl(path = ''): string {
	return `${nestApiBaseUrl()}/patients${path}`;
}

function appointmentsUrl(path = ''): string {
	return `${nestApiBaseUrl()}/appointments${path}`;
}

function clinicalUnavailable(message: string): Promise<never> {
	return Promise.reject(new ApiError(message, 404));
}

export const medicalRealAPI = {
	listPatients: async ({pageParam, query, status, sort}: PatientSearchParams = {}): Promise<PatientSearchResult> => {
		const params = new URLSearchParams();
		if (query) params.set('q', query);
		if (status && status !== 'all') params.set('status', status);
		if (sort) params.set('sort', sort);
		if (pageParam !== undefined) params.set('page', String(pageParam));
		const suffix = params.toString() ? `?${params.toString()}` : '';
		try {
			const result = await apiFetch<PatientSearchResultRdo>(patientsUrl(suffix));
			return {
				patients: result.patients.map(patientFromRdo),
				nextPage: result.nextPage,
				hasMore: result.hasMore,
			};
		} catch (error) {
			toast.error('Failed to load patients');
			throw error;
		}
	},

	searchPatients: async (params: PatientSearchParams): Promise<PatientSearchResult> => {
		return medicalRealAPI.listPatients(params);
	},

	getPatient: async (patientId: string): Promise<Patient> => {
		try {
			const rdo = await apiFetch<PatientRdo>(patientsUrl(`/${patientId}`));
			return patientFromRdo(rdo);
		} catch (error) {
			toast.error('Failed to load patient information');
			throw error;
		}
	},

	createPatient: async (input: PatientDemographicsInput): Promise<Patient> => {
		try {
			const rdo = await apiFetch<PatientRdo>(patientsUrl(), {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(input),
			});
			return patientFromRdo(rdo);
		} catch (error) {
			toast.error('Failed to create patient');
			throw error;
		}
	},

	updatePatient: async (patientId: string, updates: Partial<Patient>): Promise<Patient> => {
		try {
			const rdo = await apiFetch<PatientRdo>(patientsUrl(`/${patientId}`), {
				method: 'PATCH',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(updates),
			});
			return patientFromRdo(rdo);
		} catch (error) {
			toast.error('Failed to update patient information');
			throw error;
		}
	},

	getPatientHistory: async (patientId: string): Promise<HistoryEntry[]> => {
		try {
			const result = await apiFetch<HistoryListRdo>(patientsUrl(`/${patientId}/history`));
			return result.history.map(historyFromRdo);
		} catch (error) {
			toast.error('Failed to load history');
			throw error;
		}
	},

	getPatientConditions: async (patientId: string): Promise<ClinicalCondition[]> => {
		try {
			const result = await apiFetch<ConditionListRdo>(patientsUrl(`/${patientId}/conditions`));
			return result.conditions.map(conditionFromRdo);
		} catch (error) {
			toast.error('Failed to load conditions');
			throw error;
		}
	},

	getPatientVitals: async (patientId: string): Promise<Vital[]> => {
		try {
			const result = await apiFetch<VitalListRdo>(patientsUrl(`/${patientId}/vitals`));
			return result.vitals.map(vitalFromRdo);
		} catch (error) {
			toast.error('Failed to load vitals');
			throw error;
		}
	},

	getPatientMedications: async (patientId: string): Promise<Medication[]> => {
		try {
			const result = await apiFetch<MedicationListRdo>(patientsUrl(`/${patientId}/medications`));
			return result.medications.map(medicationFromRdo);
		} catch (error) {
			toast.error('Failed to load medications');
			throw error;
		}
	},

	getPatientDocuments: async (_patientId: string): Promise<PatientDocument[]> => {
		return clinicalUnavailable('Patient documents are not available from the patient API');
	},

	listProviders: async (): Promise<Provider[]> => {
		return [liveDemoProvider];
	},

	getProvider: async (providerId: string): Promise<Provider> => {
		if (providerId !== liveDemoProvider.id) {
			throw new ApiError('Failed to load provider information', 404);
		}
		return liveDemoProvider;
	},

	listAppointments: async (): Promise<Appointment[]> => {
		try {
			const result = await apiFetch<AppointmentSearchResultRdo>(appointmentsUrl());
			return result.appointments.map(appointmentFromRdo);
		} catch (error) {
			toast.error('Failed to load appointments');
			throw error;
		}
	},

	createAppointment: async (input: AppointmentCreateInput): Promise<Appointment> => {
		try {
			const rdo = await apiFetch<AppointmentRdo>(appointmentsUrl(), {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(input),
			});
			return appointmentFromRdo(rdo);
		} catch (error) {
			toast.error('Failed to schedule appointment');
			throw error;
		}
	},
};

export const medicalAPI = isMockMode() ? medicalMockAPI : medicalRealAPI;
