import type {PatientNameSort, PatientStatusFilter} from '@/lib/api/medical-api';

/** Matches the API, which pages the patient directory at a fixed 10 rows. */
export const PATIENT_PAGE_SIZE = 10;

export const DEFAULT_PATIENT_STATUS: PatientStatusFilter = 'all';
export const DEFAULT_PATIENT_SORT: PatientNameSort = 'name-asc';

const STATUSES: readonly PatientStatusFilter[] = ['all', 'active', 'inactive'];
const SORTS: readonly PatientNameSort[] = ['name-asc', 'name-desc'];

/** URL values are untrusted: anything outside the allowed set falls back to the default. */
export function parsePatientStatus(value: string | null | undefined): PatientStatusFilter {
	return STATUSES.find((status) => status === value) ?? DEFAULT_PATIENT_STATUS;
}

export function parsePatientSort(value: string | null | undefined): PatientNameSort {
	return SORTS.find((sort) => sort === value) ?? DEFAULT_PATIENT_SORT;
}

export function patientPageRange(page: number, count: number): {first: number; last: number} {
	if (count === 0) {
		return {first: 0, last: 0};
	}
	const first = (page - 1) * PATIENT_PAGE_SIZE + 1;
	return {first, last: first + count - 1};
}
