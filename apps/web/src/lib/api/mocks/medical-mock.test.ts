import {medicalMockAPI} from '@/lib/api/mocks/medical-mock';

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
