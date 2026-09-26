import {z} from 'zod';

export const telehealthSessionCreateSchema = z.object({
	appointmentId: z.uuid(),
});

export type TelehealthSessionCreateBody = z.infer<typeof telehealthSessionCreateSchema>;

export const telehealthSessionIdParamsSchema = z.object({
	id: z.uuid(),
});

export type TelehealthSessionIdParams = z.infer<typeof telehealthSessionIdParamsSchema>;
