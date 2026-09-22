import {Patient} from '@/types/medical/patient';
import {Medication} from '@/types/medical/medication';
import {Vital} from '@/types/medical/vital';
import {HistoryEntry} from '@/types/medical/history';
import {PatientDocument} from '@/types/medical/document';
import {Provider} from '@/types/medical/provider';
import {toast} from 'react-hot-toast';
import {apiFetch} from '@/lib/api/http';
import {medicalMockAPI} from '@/lib/api/mocks/medical-mock';
import {isMockMode} from '@/lib/api/mocks/runtime';

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

const medicalRealAPI = {
	listPatients: async ({pageParam, query, status, sort}: PatientSearchParams = {}): Promise<PatientSearchResult> => {
		const params = new URLSearchParams();
		if (query) params.set('q', query);
		if (status && status !== 'all') params.set('status', status);
		if (sort) params.set('sort', sort);
		if (pageParam !== undefined) params.set('page', String(pageParam));
		const suffix = params.toString() ? `?${params.toString()}` : '';
		try {
			return await apiFetch<PatientSearchResult>(`/api/patients${suffix}`);
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
			return await apiFetch<Patient>(`/api/patients/${patientId}`, {
				headers: {'X-Audit-Context': `patient_access_${patientId}`},
			});
		} catch (error) {
			toast.error('Failed to load patient information');
			throw error;
		}
	},

	updatePatient: async (patientId: string, updates: Partial<Patient>): Promise<Patient> => {
		try {
			return await apiFetch<Patient>(`/api/patients/${patientId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'X-Audit-Context': `patient_update_${patientId}`,
				},
				body: JSON.stringify(updates),
			});
		} catch (error) {
			toast.error('Failed to update patient information');
			throw error;
		}
	},

	getPatientHistory: async (patientId: string): Promise<HistoryEntry[]> => {
		try {
			return await apiFetch<HistoryEntry[]>(`/api/patients/${patientId}/history`, {
				headers: {'X-Audit-Context': `history_access_${patientId}`},
			});
		} catch (error) {
			toast.error('Failed to fetch patient history');
			throw error;
		}
	},

	getPatientVitals: async (patientId: string): Promise<Vital[]> => {
		try {
			return await apiFetch<Vital[]>(`/api/patients/${patientId}/vitals`, {
				headers: {'X-Audit-Context': `vitals_access_${patientId}`},
			});
		} catch (error) {
			toast.error('Failed to fetch patient vitals');
			throw error;
		}
	},

	getPatientMedications: async (patientId: string): Promise<Medication[]> => {
		try {
			return await apiFetch<Medication[]>(`/api/patients/${patientId}/medications`, {
				headers: {'X-Audit-Context': `medications_access_${patientId}`},
			});
		} catch (error) {
			toast.error('Failed to fetch patient medications');
			throw error;
		}
	},

	getPatientDocuments: async (patientId: string): Promise<PatientDocument[]> => {
		try {
			return await apiFetch<PatientDocument[]>(`/api/patients/${patientId}/documents`, {
				headers: {'X-Audit-Context': `documents_access_${patientId}`},
			});
		} catch (error) {
			toast.error('Failed to fetch patient documents');
			throw error;
		}
	},

	getProvider: async (providerId: string): Promise<Provider> => {
		try {
			return await apiFetch<Provider>(`/api/providers/${providerId}`);
		} catch (error) {
			toast.error('Failed to load provider information');
			throw error;
		}
	},
};

export const medicalAPI = isMockMode() ? medicalMockAPI : medicalRealAPI;
