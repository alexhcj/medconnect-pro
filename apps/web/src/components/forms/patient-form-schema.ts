import {z} from 'zod';
import {Patient} from '@/types/medical/patient';

const requiredText = (message: string) => z.string().trim().min(1, message);

const GENDERS = new Set(['female', 'male', 'non-binary']);

function todayIso() {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${now.getFullYear()}-${month}-${day}`;
}

export const patientFormSchema = z.object({
	firstName: requiredText('First name is required'),
	lastName: requiredText('Last name is required'),
	dateOfBirth: z
		.string()
		.min(1, 'Date of birth is required')
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
		.refine((value) => value <= todayIso(), 'Date of birth cannot be in the future'),
	gender: z
		.string()
		.min(1, 'Select a gender')
		.refine((value) => GENDERS.has(value), 'Select a gender'),
	status: z.enum(['active', 'inactive'], {error: 'Select a status'}),
	phone: requiredText('Phone is required'),
	email: z.email('Enter a valid email address'),
	address: z.object({
		street: requiredText('Street is required'),
		city: requiredText('City is required'),
		state: requiredText('State is required'),
		postalCode: requiredText('Postal code is required'),
	}),
	emergencyContact: z.object({
		name: requiredText('Emergency contact name is required'),
		relationship: requiredText('Relationship is required'),
		phone: requiredText('Emergency phone is required'),
	}),
	insurance: z.object({
		provider: requiredText('Insurance provider is required'),
		policyNumber: requiredText('Policy number is required'),
		groupNumber: requiredText('Group number is required'),
	}),
	providerId: requiredText('Assigned provider is required'),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export const PATIENT_FIELD_PATHS = [
	'firstName',
	'lastName',
	'dateOfBirth',
	'gender',
	'status',
	'phone',
	'email',
	'address.street',
	'address.city',
	'address.state',
	'address.postalCode',
	'emergencyContact.name',
	'emergencyContact.relationship',
	'emergencyContact.phone',
	'insurance.provider',
	'insurance.policyNumber',
	'insurance.groupNumber',
	'providerId',
] as const satisfies readonly (keyof PatientFormValues | `${string}.${string}`)[];

export function isPatientFieldPath(path: string): path is (typeof PATIENT_FIELD_PATHS)[number] {
	return (PATIENT_FIELD_PATHS as readonly string[]).includes(path);
}

export function emptyPatientFormValues(): PatientFormValues {
	return {
		firstName: '',
		lastName: '',
		dateOfBirth: '',
		gender: '',
		status: 'active',
		phone: '',
		email: '',
		address: {street: '', city: '', state: '', postalCode: ''},
		emergencyContact: {name: '', relationship: '', phone: ''},
		insurance: {provider: '', policyNumber: '', groupNumber: ''},
		providerId: '',
	};
}

export function patientToFormValues(patient: Patient): PatientFormValues {
	return {
		firstName: patient.firstName,
		lastName: patient.lastName,
		dateOfBirth: patient.dateOfBirth,
		gender: patient.gender,
		status: patient.status,
		phone: patient.phone,
		email: patient.email,
		address: {...patient.address},
		emergencyContact: {...patient.emergencyContact},
		insurance: {...patient.insurance},
		providerId: patient.providerId,
	};
}
