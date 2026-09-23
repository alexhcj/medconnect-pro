import {ApiError} from '@/lib/api/http';
import {medicalMockAPI} from '@/lib/api/mocks/medical-mock';
import {PatientDemographicsInput} from '@/types/medical/patient';

describe('medicalMockAPI.listPatients', () => {
	it('returns the first page of ten and a second page', async () => {
		const first = await medicalMockAPI.listPatients({pageParam: 1});
		const second = await medicalMockAPI.listPatients({pageParam: 2});

		expect(first.patients).toHaveLength(10);
		expect(first.hasMore).toBe(true);
		expect(first.nextPage).toBe(2);
		expect(first.patients[0]?.firstName).toBe('Avery');
		expect(second.patients).toHaveLength(10);
		expect(second.hasMore).toBe(false);
		expect(second.patients.map((patient) => patient.id)).not.toEqual(
			first.patients.map((patient) => patient.id),
		);
	});

	it('matches a search across name, email, phone, and id', async () => {
		const byName = await medicalMockAPI.listPatients({query: 'Avery'});
		const byEmail = await medicalMockAPI.listPatients({query: 'patient015@example.test'});
		const byPhone = await medicalMockAPI.listPatients({query: '555-010-1003'});
		const byId = await medicalMockAPI.listPatients({query: 'demo-patient-014'});

		expect(byName.patients.map((patient) => patient.lastName)).toEqual(['Carter']);
		expect(byEmail.patients.map((patient) => patient.lastName)).toEqual(['Bailey']);
		expect(byPhone.patients.map((patient) => patient.lastName)).toEqual(['Bennett']);
		expect(byId.patients.map((patient) => patient.lastName)).toEqual(['Ward']);
	});

	it('returns no patients when the search matches nothing', async () => {
		const result = await medicalMockAPI.listPatients({query: 'nomatch-zz'});

		expect(result.patients).toEqual([]);
		expect(result.hasMore).toBe(false);
		expect(result.nextPage).toBeUndefined();
	});

	it('filters by status before paging', async () => {
		const inactive = await medicalMockAPI.listPatients({status: 'inactive'});
		const active = await medicalMockAPI.listPatients({status: 'active', pageParam: 1});

		expect(inactive.patients.length).toBeGreaterThan(0);
		expect(inactive.patients.every((patient) => patient.status === 'inactive')).toBe(true);
		expect(inactive.hasMore).toBe(false);
		expect(active.patients.every((patient) => patient.status === 'active')).toBe(true);
		expect(active.hasMore).toBe(true);
	});

	it('sorts by last name and resets the first page', async () => {
		const ascending = await medicalMockAPI.listPatients({sort: 'name-asc', pageParam: 1});
		const descending = await medicalMockAPI.listPatients({sort: 'name-desc', pageParam: 1});

		expect(ascending.patients[0]).toMatchObject({firstName: 'Rowan', lastName: 'Bailey'});
		expect(descending.patients[0]).toMatchObject({firstName: 'Skyler', lastName: 'Ward'});
		expect(ascending.patients.map((patient) => patient.lastName)).toEqual(
			[...ascending.patients.map((patient) => patient.lastName)].sort((a, b) => a.localeCompare(b, 'en')),
		);
	});
});

const validCreate = (): PatientDemographicsInput => ({
	firstName: 'Quinn',
	lastName: 'Harlow',
	dateOfBirth: '1991-03-04',
	gender: 'non-binary',
	status: 'active',
	phone: '+1-555-010-4242',
	email: 'quinn.harlow@example.test',
	address: {street: '42 Demo Lane', city: 'Springfield', state: 'IL', postalCode: '62704'},
	emergencyContact: {name: 'Alex Harlow', relationship: 'Sibling', phone: '+1-555-010-4243'},
	insurance: {provider: 'Demo Health Partners', policyNumber: 'DEM-424242', groupNumber: 'GRP-DEMO-42'},
	providerId: 'demo-provider-001',
});

describe('medicalMockAPI.createPatient', () => {
	it('rejects a missing field with a details path', async () => {
		const input = validCreate();
		input.firstName = ' ';

		await expect(medicalMockAPI.createPatient(input)).rejects.toMatchObject({
			status: 400,
			code: 'VALIDATION_ERROR',
			details: expect.arrayContaining([{path: 'firstName', message: 'First name is required'}]),
		});
	});

	it('stores a synthetic patient on the demo practice and returns it from search', async () => {
		const created = await medicalMockAPI.createPatient(validCreate());

		expect(created).toMatchObject({
			id: 'demo-patient-021',
			lastName: 'Harlow',
			practiceId: 'demo-practice-001',
			synthetic: true,
			conditions: [],
		});

		const found = await medicalMockAPI.listPatients({query: 'Harlow'});
		expect(found.patients.map((patient) => patient.id)).toEqual(['demo-patient-021']);

		const loaded = await medicalMockAPI.getPatient(created.id);
		expect(loaded.email).toBe('quinn.harlow@example.test');
	});

	it('keeps practice, id, and conditions when demographics change', async () => {
		const before = await medicalMockAPI.getPatient('demo-patient-001');
		const updated = await medicalMockAPI.updatePatient('demo-patient-001', {
			phone: '+1-555-010-7777',
			practiceId: 'other-practice',
			conditions: [],
		});

		expect(updated.id).toBe(before.id);
		expect(updated.practiceId).toBe(before.practiceId);
		expect(updated.conditions).toEqual(before.conditions);
		expect(updated.phone).toBe('+1-555-010-7777');
		expect(updated.synthetic).toBe(true);

		await medicalMockAPI.updatePatient('demo-patient-001', {phone: before.phone});
	});

	it('returns a field error when the email is already used', async () => {
		const input = validCreate();
		input.email = 'patient001@example.test';

		try {
			await medicalMockAPI.createPatient(input);
			throw new Error('expected create to fail');
		} catch (error) {
			expect(error).toBeInstanceOf(ApiError);
			expect((error as ApiError).details).toEqual([
				{path: 'email', message: 'A patient with this email already exists'},
			]);
		}
	});
});
