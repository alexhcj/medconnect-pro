import {z} from 'zod';

export const notificationIdParamsSchema = z.object({
	id: z.uuid(),
});

export type NotificationIdParams = z.infer<typeof notificationIdParamsSchema>;

export const preferenceUpdateSchema = z
	.object({
		inAppEnabled: z.boolean().optional(),
		emailEnabled: z.boolean().optional(),
		smsEnabled: z.boolean().optional(),
		practiceId: z.uuid().optional(),
	})
	.strict();

export type PreferenceUpdateBody = z.infer<typeof preferenceUpdateSchema>;
