import {afterEach, describe, expect, it, vi} from 'vitest';
import {LIVE_DEMO_PROVIDER_ID} from '@/lib/api/live-demo-provider';
import {medicalRealAPI} from '@/lib/api/medical-api';
import type {PatientRdo} from '@/lib/api/patient-rdo';

const rdo: PatientRdo = {
	id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
	firstName: 'Avery',
	lastName: 'Quinn',
	dateOfBirth: '1988-04-12',
	gender: 'female',
	status: 'active',
	phone: '555-0100',
	email: 'avery.quinn@synthetic.example',
	address: {street: '100 Demo Street', city: 'Harborview', state: 'WA', postalCode: '98101'},
	emergencyContact: {name: 'Sky Quinn', relationship: 'Sibling', phone: '555-0101'},
	insurance: {provider: 'Synthetic Health Plan', policyNumber: 'SYN-100', groupNumber: 'GRP-1'},
	providerId: LIVE_DEMO_PROVIDER_ID,
	practiceId: '22222222-2222-4222-8222-222222222222',
	synthetic: true,
};

describe('medicalRealAPI', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('lists patients from Nest and maps PatientRdo', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({patients: [rdo], hasMore: false}),
			}),
		);

		const page = await medicalRealAPI.listPatients({query: 'Avery', status: 'active', sort: 'name-asc', pageParam: 1});

		expect(page.patients[0]).toMatchObject({
			firstName: 'Avery',
			practiceId: rdo.practiceId,
			synthetic: true,
			conditions: [],
		});
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3001/patients?q=Avery&status=active&sort=name-asc&page=1',
			expect.any(Object),
		);
	});

	it('does not request clinical routes from Nest', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		await expect(medicalRealAPI.getPatientHistory('patient-1')).rejects.toMatchObject({status: 404});
		await expect(medicalRealAPI.getPatientVitals('patient-1')).rejects.toMatchObject({status: 404});
		await expect(medicalRealAPI.getPatientMedications('patient-1')).rejects.toMatchObject({status: 404});
		await expect(medicalRealAPI.getPatientDocuments('patient-1')).rejects.toMatchObject({status: 404});
		await expect(medicalRealAPI.listAppointments()).rejects.toMatchObject({status: 404});
		await expect(
			medicalRealAPI.createAppointment({
				patientId: 'patient-1',
				providerId: LIVE_DEMO_PROVIDER_ID,
				start: '2026-10-20T10:00:00.000Z',
				end: '2026-10-20T11:00:00.000Z',
				type: 'office_visit',
				state: 'scheduled',
			}),
		).rejects.toMatchObject({status: 404});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('returns the seeded provider without calling Nest', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		await expect(medicalRealAPI.listProviders()).resolves.toEqual([
			expect.objectContaining({id: LIVE_DEMO_PROVIDER_ID, displayName: 'Dr. Jordan Ellis'}),
		]);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
