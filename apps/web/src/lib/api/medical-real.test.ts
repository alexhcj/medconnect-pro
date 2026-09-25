import {afterEach, describe, expect, it, vi} from 'vitest';
import type {AppointmentRdo} from '@/lib/api/appointment-rdo';
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

const appointmentRdo: AppointmentRdo = {
	id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
	practiceId: rdo.practiceId,
	patientId: rdo.id,
	providerId: LIVE_DEMO_PROVIDER_ID,
	start: '2026-10-15T14:00:00.000Z',
	end: '2026-10-15T15:00:00.000Z',
	type: 'office_visit',
	state: 'scheduled',
	notes: 'Annual follow-up',
	patientName: 'Avery Quinn',
	providerName: 'jordan.ellis@synthetic.example',
	synthetic: true,
};

const createInput = {
	patientId: rdo.id,
	providerId: LIVE_DEMO_PROVIDER_ID,
	start: '2026-10-20T10:00:00.000Z',
	end: '2026-10-20T11:00:00.000Z',
	type: 'office_visit' as const,
	state: 'scheduled' as const,
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

	it('lists appointments from Nest and maps AppointmentRdo', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({appointments: [appointmentRdo], hasMore: false}),
			}),
		);

		const listed = await medicalRealAPI.listAppointments();

		expect(listed[0]).toMatchObject({
			patientName: 'Avery Quinn',
			providerName: 'Dr. Jordan Ellis',
			synthetic: true,
		});
		expect(fetch).toHaveBeenCalledWith('http://localhost:3001/appointments', expect.any(Object));
	});

	it('creates an appointment on Nest and maps AppointmentRdo', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 201,
				json: async () => ({...appointmentRdo, start: createInput.start, end: createInput.end}),
			}),
		);

		const created = await medicalRealAPI.createAppointment(createInput);

		expect(created).toMatchObject({
			patientId: createInput.patientId,
			providerName: 'Dr. Jordan Ellis',
		});
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3001/appointments',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify(createInput),
			}),
		);
	});

	it('throws Nest APPOINTMENT_CONFLICT from create', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 409,
				json: async () => ({
					error: {
						code: 'APPOINTMENT_CONFLICT',
						message: 'This time overlaps an existing appointment for the provider.',
						details: [
							{
								path: 'start',
								message: 'This time overlaps an existing appointment for the provider.',
							},
						],
					},
				}),
			}),
		);

		await expect(medicalRealAPI.createAppointment(createInput)).rejects.toMatchObject({
			status: 409,
			code: 'APPOINTMENT_CONFLICT',
			details: [
				{
					path: 'start',
					message: 'This time overlaps an existing appointment for the provider.',
				},
			],
		});
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3001/appointments',
			expect.objectContaining({method: 'POST'}),
		);
	});

	it('lists history, conditions, vitals, and medications from Nest', async () => {
		const historyRdo = {
			id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
			practiceId: rdo.practiceId,
			patientId: rdo.id,
			type: 'visit' as const,
			occurredAt: '2025-07-15T10:30:00.000Z',
			title: 'Hypertension follow-up',
			summary: 'Blood pressure stable on current medication. Continue current plan.',
			providerId: LIVE_DEMO_PROVIDER_ID,
			status: 'completed' as const,
			synthetic: true,
		};
		const conditionRdo = {
			id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
			practiceId: rdo.practiceId,
			patientId: rdo.id,
			display: 'Hypertension',
			clinicalStatus: 'active' as const,
			recordedAt: '2025-07-15T10:30:00.000Z',
			recordedById: LIVE_DEMO_PROVIDER_ID,
			synthetic: true,
		};
		const vitalRdo = {
			id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
			practiceId: rdo.practiceId,
			patientId: rdo.id,
			recordedAt: '2025-07-15T10:15:00.000Z',
			systolicMmHg: 128,
			diastolicMmHg: 82,
			heartRateBpm: 72,
			temperatureC: 36.7,
			respiratoryRate: 16,
			spo2Percent: 98,
			weightKg: 72.5,
			recordedById: LIVE_DEMO_PROVIDER_ID,
			synthetic: true,
		};
		const medicationRdo = {
			id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
			practiceId: rdo.practiceId,
			patientId: rdo.id,
			name: 'Lisinopril',
			dosage: '10mg',
			frequency: 'Once daily',
			route: 'oral',
			startDate: '2023-01-10',
			prescriberId: LIVE_DEMO_PROVIDER_ID,
			instructions: 'Take in the morning with water',
			status: 'active' as const,
			synthetic: true,
		};

		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo) => {
				const url = String(input);
				if (url.endsWith('/history')) {
					return {ok: true, status: 200, json: async () => ({history: [historyRdo]})};
				}
				if (url.endsWith('/conditions')) {
					return {ok: true, status: 200, json: async () => ({conditions: [conditionRdo]})};
				}
				if (url.endsWith('/vitals')) {
					return {ok: true, status: 200, json: async () => ({vitals: [vitalRdo]})};
				}
				if (url.endsWith('/medications')) {
					return {ok: true, status: 200, json: async () => ({medications: [medicationRdo]})};
				}
				return {ok: false, status: 404, json: async () => ({})};
			}),
		);

		await expect(medicalRealAPI.getPatientHistory(rdo.id)).resolves.toEqual([
			expect.objectContaining({title: 'Hypertension follow-up', patientId: rdo.id}),
		]);
		await expect(medicalRealAPI.getPatientConditions(rdo.id)).resolves.toEqual([
			expect.objectContaining({display: 'Hypertension', patientId: rdo.id}),
		]);
		await expect(medicalRealAPI.getPatientVitals(rdo.id)).resolves.toEqual([
			expect.objectContaining({systolicMmHg: 128, patientId: rdo.id}),
		]);
		await expect(medicalRealAPI.getPatientMedications(rdo.id)).resolves.toEqual([
			expect.objectContaining({name: 'Lisinopril', patientId: rdo.id}),
		]);
		expect(fetch).toHaveBeenCalledWith(`http://localhost:3001/patients/${rdo.id}/history`, expect.any(Object));
		expect(fetch).toHaveBeenCalledWith(
			`http://localhost:3001/patients/${rdo.id}/conditions`,
			expect.any(Object),
		);
		expect(fetch).toHaveBeenCalledWith(`http://localhost:3001/patients/${rdo.id}/vitals`, expect.any(Object));
		expect(fetch).toHaveBeenCalledWith(
			`http://localhost:3001/patients/${rdo.id}/medications`,
			expect.any(Object),
		);
	});

	it('does not request documents from Nest', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		await expect(medicalRealAPI.getPatientDocuments('patient-1')).rejects.toMatchObject({status: 404});
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
