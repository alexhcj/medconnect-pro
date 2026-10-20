import {parsePatientSort, parsePatientStatus, patientPageRange} from '@/lib/patients/list-params';

describe('patient list params', () => {
	it('accepts known statuses and falls back to all', () => {
		expect(parsePatientStatus('inactive')).toBe('inactive');
		expect(parsePatientStatus('archived')).toBe('all');
		expect(parsePatientStatus(undefined)).toBe('all');
	});

	it('accepts known sorts and falls back to name-asc', () => {
		expect(parsePatientSort('name-desc')).toBe('name-desc');
		expect(parsePatientSort('dob')).toBe('name-asc');
		expect(parsePatientSort(null)).toBe('name-asc');
	});

	it('computes the shown range for a page of 10', () => {
		expect(patientPageRange(1, 10)).toEqual({first: 1, last: 10});
		expect(patientPageRange(3, 4)).toEqual({first: 21, last: 24});
		expect(patientPageRange(5, 0)).toEqual({first: 0, last: 0});
	});
});
