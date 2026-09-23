import type {PatientDemographics} from '../src/practice/patient.repository.js';

export function syntheticDemographics(
	providerId: string,
	overrides: Partial<PatientDemographics> = {},
): PatientDemographics {
	return {
		firstName: 'Avery',
		lastName: 'Quinn',
		dateOfBirth: '1988-04-12',
		gender: 'female',
		status: 'active',
		phone: '555-0100',
		email: 'avery.quinn@synthetic.example',
		street: '100 Demo Street',
		city: 'Harborview',
		state: 'WA',
		postalCode: '98101',
		emergencyContactName: 'Sky Quinn',
		emergencyContactRelationship: 'Sibling',
		emergencyContactPhone: '555-0101',
		insuranceProvider: 'Synthetic Health Plan',
		insurancePolicyNumber: 'SYN-100',
		insuranceGroupNumber: 'GRP-1',
		providerId,
		...overrides,
	};
}

export function syntheticPatientColumns(providerId: string, overrides: Partial<PatientDemographics> = {}) {
	const demographics = syntheticDemographics(providerId, overrides);
	return {
		firstName: demographics.firstName,
		lastName: demographics.lastName,
		dateOfBirth: demographics.dateOfBirth,
		gender: demographics.gender,
		status: demographics.status,
		phone: demographics.phone,
		email: demographics.email,
		street: demographics.street,
		city: demographics.city,
		state: demographics.state,
		postalCode: demographics.postalCode,
		emergencyContactName: demographics.emergencyContactName,
		emergencyContactRelationship: demographics.emergencyContactRelationship,
		emergencyContactPhone: demographics.emergencyContactPhone,
		insuranceProvider: demographics.insuranceProvider,
		insurancePolicyNumber: demographics.insurancePolicyNumber,
		insuranceGroupNumber: demographics.insuranceGroupNumber,
		assignedProviderUserId: demographics.providerId,
		synthetic: true,
	};
}
