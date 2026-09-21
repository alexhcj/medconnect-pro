import {z} from 'zod';
import {DEFAULT_DATABASE_URL} from '../persistence/default-database-url.js';

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

const databaseUrl = z.preprocess((value) => {
	if (value === undefined || value === '') {
		return undefined;
	}
	return value;
}, z.string().regex(/^postgres(ql)?:\/\//, 'DATABASE_URL must be a PostgreSQL connection URL').default(DEFAULT_DATABASE_URL));

export const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().int().positive().default(3001),
	SWAGGER_UI_ENABLED: booleanFromEnv,
	DATABASE_URL: databaseUrl,
});

export type Env = z.infer<typeof envSchema>;
