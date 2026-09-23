import {patientFormSchema} from '@/components/forms/patient-form-schema';

const valid = {
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
};

describe('patientFormSchema', () => {
	it('accepts profile demographics', () => {
		expect(patientFormSchema.safeParse(valid).success).toBe(true);
	});

	it('rejects a future date of birth', () => {
		const result = patientFormSchema.safeParse({...valid, dateOfBirth: '2999-01-01'});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((issue) => issue.message === 'Date of birth cannot be in the future')).toBe(
				true,
			);
		}
	});

	it('rejects an empty name', () => {
		const result = patientFormSchema.safeParse({...valid, firstName: ' '});
		expect(result.success).toBe(false);
	});
});