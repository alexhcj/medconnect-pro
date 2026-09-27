import {z} from 'zod';
import {DOCUMENT_CATEGORIES} from '../persistence/entities/patient-document.entity.js';

export const patientIdParamsSchema = z.object({
	id: z.uuid(),
});

export type PatientIdParams = z.infer<typeof patientIdParamsSchema>;

export const documentContentParamsSchema = z.object({
	id: z.uuid(),
	documentId: z.uuid(),
});

export type DocumentContentParams = z.infer<typeof documentContentParamsSchema>;

export const documentUploadFieldsSchema = z.object({
	category: z.enum(DOCUMENT_CATEGORIES),
});

export type DocumentUploadFields = z.infer<typeof documentUploadFieldsSchema>;
