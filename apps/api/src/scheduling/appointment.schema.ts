import {z} from 'zod';
import {
	APPOINTMENT_CREATE_STATES,
	APPOINTMENT_STATES,
	APPOINTMENT_TYPES,
} from '../persistence/entities/appointment.entity.js';
import {AVAILABILITY_MAX_WINDOW_MS} from './availability.js';

const isoInstant = z.iso.datetime();
const typeSchema = z.enum(APPOINTMENT_TYPES);
const createStateSchema = z.enum(APPOINTMENT_CREATE_STATES);
const stateSchema = z.enum(APPOINTMENT_STATES);

const optionalNotes = z
	.string()
	.max(500)
	.optional()
	.transform((value) => {
		if (value === undefined) {
			return undefined;
		}
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	});

function endAfterStart(start: string, end: string): boolean {
	return new Date(end) > new Date(start);
}

export const appointmentCreateSchema = z
	.object({
		patientId: z.uuid(),
		providerId: z.uuid(),
		start: isoInstant,
		end: isoInstant,
		type: typeSchema,
		state: createStateSchema,
		notes: optionalNotes,
	})
	.superRefine((value, ctx) => {
		if (!endAfterStart(value.start, value.end)) {
			ctx.addIssue({code: 'custom', path: ['end'], message: 'End must be after start'});
		}
	});

export type AppointmentCreateBody = z.infer<typeof appointmentCreateSchema>;

export const appointmentUpdateSchema = z
	.object({
		patientId: z.uuid().optional(),
		providerId: z.uuid().optional(),
		start: isoInstant.optional(),
		end: isoInstant.optional(),
		type: typeSchema.optional(),
		state: stateSchema.optional(),
		notes: optionalNotes,
	})
	.superRefine((value, ctx) => {
		if (value.start && value.end && !endAfterStart(value.start, value.end)) {
			ctx.addIssue({code: 'custom', path: ['end'], message: 'End must be after start'});
		}
	});

export type AppointmentUpdateBody = z.infer<typeof appointmentUpdateSchema>;

const optionalInstant = z.preprocess(
	(value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
	isoInstant.optional(),
);

export const appointmentListQuerySchema = z
	.object({
		from: optionalInstant,
		to: optionalInstant,
		patientId: z.uuid().optional(),
		providerId: z.uuid().optional(),
		state: stateSchema.optional(),
		page: z.preprocess(
			(value) => (value === undefined || value === '' ? undefined : value),
			z.coerce.number().int().min(1).max(1000).optional(),
		),
		pageSize: z.preprocess(
			(value) => (value === undefined || value === '' ? undefined : value),
			z.coerce.number().int().min(1).max(100).optional(),
		),
	})
	.superRefine((value, ctx) => {
		if (value.from && value.to && !endAfterStart(value.from, value.to)) {
			ctx.addIssue({code: 'custom', path: ['to'], message: 'End must be after start'});
		}
	});

export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;

export const appointmentIdParamsSchema = z.object({
	id: z.uuid(),
});

export type AppointmentIdParams = z.infer<typeof appointmentIdParamsSchema>;

export const providerIdParamsSchema = z.object({
	id: z.uuid(),
});

export type ProviderIdParams = z.infer<typeof providerIdParamsSchema>;

export const availabilityQuerySchema = z
	.object({
		from: isoInstant,
		to: isoInstant,
	})
	.superRefine((value, ctx) => {
		if (!endAfterStart(value.from, value.to)) {
			ctx.addIssue({code: 'custom', path: ['to'], message: 'End must be after start'});
			return;
		}
		const span = new Date(value.to).getTime() - new Date(value.from).getTime();
		if (span > AVAILABILITY_MAX_WINDOW_MS) {
			ctx.addIssue({
				code: 'custom',
				path: ['to'],
				message: 'Availability window cannot exceed 31 days',
			});
		}
	});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
