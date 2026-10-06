import {z} from 'zod';

export const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(8),
	practiceId: z.uuid().optional(),
});

export type LoginBody = z.infer<typeof loginSchema>;

export const refreshSchema = z.preprocess(
	(value) => (value == null ? {} : value),
	z.object({
		refreshToken: z.string().min(1).optional(),
	}),
);

export type RefreshBody = z.infer<typeof refreshSchema>;

export const mfaVerifySchema = z.object({
	mfaToken: z.string().min(1).optional(),
	code: z.string().min(1),
});

export type MfaVerifyBody = z.infer<typeof mfaVerifySchema>;
