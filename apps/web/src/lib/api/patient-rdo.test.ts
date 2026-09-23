import {describe, expect, it} from 'vitest';
import {patientFromRdo, type PatientRdo} from '@/lib/api/patient-rdo';

const rdo: PatientRdo = {
	id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
	firstName: 'Avery',
	lastName: 'Quinn',
	dateOfBirth: '1988-04-12',
	gender: 'female',
	status: 'active',
	phone: '555-0100',
	email: 'avery.quinn@synthetic.example',
	address: {
		street: '100 Demo Street',
		city: 'Harborview',
		state: 'WA',
		postalCode: '98101',
	},
	emergencyContact: {
		name: 'Sky Quinn',
		relationship: 'Sibling',
		phone: '555-0101',
	},
	insurance: {
		provider: 'Synthetic Health Plan',
		policyNumber: 'SYN-100',
		groupNumber: 'GRP-1',
	},
	providerId: '11111111-1111-4111-8111-111111111111',
	practiceId: '22222222-2222-4222-8222-222222222222',
	synthetic: true,
};

describe('patientFromRdo', () => {
	it('maps PatientRdo onto the UI patient and leaves clinical conditions empty', () => {
		expect(patientFromRdo(rdo)).toEqual({
			...rdo,
			conditions: [],
		});
	});
});
