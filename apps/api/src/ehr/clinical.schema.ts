import {z} from 'zod';
import {
	CLINICAL_CONDITION_STATUSES,
} from '../persistence/entities/clinical-condition.entity.js';
import {
	HISTORY_ENTRY_STATUSES,
	HISTORY_ENTRY_TYPES,
} from '../persistence/entities/clinical-history.entity.js';
import {MEDICATION_STATUSES} from '../persistence/entities/medication.entity.js';

const requiredText = (max: number) => z.string().trim().min(1).max(max);
const isoInstant = z.iso.datetime();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date');

export const patientIdParamsSchema = z.object({
	id: z.uuid(),
});

export type PatientIdParams = z.infer<typeof patientIdParamsSchema>;

export const historyCreateSchema = z.object({
	type: z.enum(HISTORY_ENTRY_TYPES),
	occurredAt: isoInstant,
	title: requiredText(200),
	summary: requiredText(2000),
	status: z.enum(HISTORY_ENTRY_STATUSES),
});

export type HistoryCreateBody = z.infer<typeof historyCreateSchema>;

export const conditionCreateSchema = z.object({
	display: requiredText(200),
	clinicalStatus: z.enum(CLINICAL_CONDITION_STATUSES),
	recordedAt: isoInstant,
});

export type ConditionCreateBody = z.infer<typeof conditionCreateSchema>;

export const vitalCreateSchema = z.object({
	recordedAt: isoInstant,
	systolicMmHg: z.number().int().min(1).max(300),
	diastolicMmHg: z.number().int().min(1).max(200),
	heartRateBpm: z.number().int().min(1).max(300),
	temperatureC: z.number().min(30).max(45),
	respiratoryRate: z.number().int().min(1).max(80),
	spo2Percent: z.number().int().min(0).max(100),
	weightKg: z.number().min(0.1).max(500),
});

export type VitalCreateBody = z.infer<typeof vitalCreateSchema>;

export const medicationCreateSchema = z
	.object({
		name: requiredText(200),
		dosage: requiredText(100),
		frequency: requiredText(100),
		route: requiredText(100),
		startDate: isoDate,
		endDate: isoDate.optional(),
		instructions: requiredText(500),
		status: z.enum(MEDICATION_STATUSES),
	})
	.superRefine((value, ctx) => {
		if (value.endDate && value.endDate < value.startDate) {
			ctx.addIssue({code: 'custom', path: ['endDate'], message: 'End date must be on or after start date'});
		}
	});

export type MedicationCreateBody = z.infer<typeof medicationCreateSchema>;
