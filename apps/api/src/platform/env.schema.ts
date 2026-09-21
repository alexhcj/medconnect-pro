import {z} from 'zod';

const booleanFromEnv = z.preprocess((value) => {
	if (value === undefined || value === '') {
		return undefined;
	}
	if (typeof value === 'boolean') {
		return value;
	}
	if (typeof value === 'string') {
		const normalized = value.toLowerCase();
		if (normalized === 'true' || normalized === '1') {
			return true;
		}
		if (normalized === 'false' || normalized === '0') {
			return false;
		}
	}
	return value;
}, z.boolean().optional());

export const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().int().positive().default(3001),
	SWAGGER_UI_ENABLED: booleanFromEnv,
});

export type Env = z.infer<typeof envSchema>;
