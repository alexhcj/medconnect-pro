import {z} from 'zod';

const isoInstant = z.iso.datetime();

const optionalInstant = z.preprocess(
	(value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
	isoInstant.optional(),
);

const optionalText = z.preprocess(
	(value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
	z.string().trim().min(1).max(80).optional(),
);

export const auditEventListQuerySchema = z
	.object({
		action: optionalText,
		resourceType: optionalText,
		from: optionalInstant,
		to: optionalInstant,
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
		if (value.from && value.to && new Date(value.to) <= new Date(value.from)) {
			ctx.addIssue({code: 'custom', path: ['to'], message: 'End must be after start'});
		}
	});

export type AuditEventListQuery = z.infer<typeof auditEventListQuerySchema>;
