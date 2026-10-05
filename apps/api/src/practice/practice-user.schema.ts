import {z} from 'zod';
import {PRACTICE_ROLES} from '../tenancy/practice-role.js';

export const practiceUserIdParamsSchema = z.object({
	id: z.uuid(),
});

export type PracticeUserIdParams = z.infer<typeof practiceUserIdParamsSchema>;

export const practiceUserRoleUpdateSchema = z
	.object({
		role: z.enum(PRACTICE_ROLES),
		practiceId: z.uuid().optional(),
	})
	.strict();

export type PracticeUserRoleUpdateBody = z.infer<typeof practiceUserRoleUpdateSchema>;
