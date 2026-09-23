import {z} from 'zod';

const requiredText = (max: number) => z.string().trim().min(1).max(max);

const isoDate = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
	.refine((value) => value <= todayIsoUtc(), 'Date of birth cannot be in the future');

const genderSchema = z.enum(['female', 'male', 'non-binary']);
const statusSchema = z.enum(['active', 'inactive']);

const addressSchema = z.object({
	street: requiredText(200),
	city: requiredText(100),
	state: requiredText(100),
	postalCode: requiredText(20),
});

const emergencyContactSchema = z.object({
	name: requiredText(100),
	relationship: requiredText(100),
	phone: requiredText(40),
});

const insuranceSchema = z.object({
	provider: requiredText(200),
	policyNumber: requiredText(100),
	groupNumber: requiredText(100),
});

const demographicsShape = {
	firstName: requiredText(100),
	lastName: requiredText(100),
	dateOfBirth: isoDate,
	gender: genderSchema,
	status: statusSchema,
	phone: requiredText(40),
	email: z.email(),
	address: addressSchema,
	emergencyContact: emergencyContactSchema,
	insurance: insuranceSchema,
	providerId: z.uuid(),
};

export const patientCreateSchema = z.object(demographicsShape);

export type PatientCreateBody = z.infer<typeof patientCreateSchema>;

export const patientUpdateSchema = z.object({
	firstName: demographicsShape.firstName.optional(),
	lastName: demographicsShape.lastName.optional(),
	dateOfBirth: demographicsShape.dateOfBirth.optional(),
	gender: demographicsShape.gender.optional(),
	status: demographicsShape.status.optional(),
	phone: demographicsShape.phone.optional(),
	email: demographicsShape.email.optional(),
	address: addressSchema.optional(),
	emergencyContact: emergencyContactSchema.optional(),
	insurance: insuranceSchema.optional(),
	providerId: demographicsShape.providerId.optional(),
});

export type PatientUpdateBody = z.infer<typeof patientUpdateSchema>;

export const patientListQuerySchema = z.object({
	q: z.preprocess(
		(value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
		z.string().trim().min(1).max(200).optional(),
	),
	status: statusSchema.optional(),
	sort: z.enum(['name-asc', 'name-desc']).optional(),
	page: z.preprocess(
		(value) => (value === undefined || value === '' ? undefined : value),
		z.coerce.number().int().min(1).max(1000).optional(),
	),
});

export type PatientListQuery = z.infer<typeof patientListQuerySchema>;

export const patientIdParamsSchema = z.object({
	id: z.uuid(),
});

export type PatientIdParams = z.infer<typeof patientIdParamsSchema>;

function todayIsoUtc(): string {
	return new Date().toISOString().slice(0, 10);
}
