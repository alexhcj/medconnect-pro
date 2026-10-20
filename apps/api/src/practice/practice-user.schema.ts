import {z} from 'zod';
import {pageQueryShape} from '../platform/pagination.js';
import {PRACTICE_ROLES} from '../tenancy/practice-role.js';

export const practiceUserIdParamsSchema = z.object({
	id: z.uuid(),
});

export type PracticeUserIdParams = z.infer<typeof practiceUserIdParamsSchema>;

const emptyToUndefined = (value: unknown) =>
	typeof value === 'string' && value.trim() === '' ? undefined : value;

export const practiceUserListQuerySchema = z.object({
	...pageQueryShape,
	q: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(200).optional()),
	role: z.preprocess(emptyToUndefined, z.enum(PRACTICE_ROLES).optional()),
});

export type PracticeUserListQuery = z.infer<typeof practiceUserListQuerySchema>;

export const practiceUserRoleUpdateSchema = z
	.object({
		role: z.enum(PRACTICE_ROLES),
		practiceId: z.uuid().optional(),
	})
	.strict();

export type PracticeUserRoleUpdateBody = z.infer<typeof practiceUserRoleUpdateSchema>;
