import {z} from 'zod';
import {DEFAULT_DATABASE_ADMIN_URL, DEFAULT_DATABASE_URL} from '../persistence/default-database-url.js';

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

const postgresUrl = (label: string, fallback: string) =>
	z.preprocess((value) => {
		if (value === undefined || value === '') {
			return undefined;
		}
		return value;
	}, z.string().regex(/^postgres(ql)?:\/\//, `${label} must be a PostgreSQL connection URL`).default(fallback));

export const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().int().positive().default(3001),
	SWAGGER_UI_ENABLED: booleanFromEnv,
	DATABASE_URL: postgresUrl('DATABASE_URL', DEFAULT_DATABASE_URL),
	DATABASE_ADMIN_URL: postgresUrl('DATABASE_ADMIN_URL', DEFAULT_DATABASE_ADMIN_URL),
	DOCUMENT_STORAGE_DIR: z.preprocess((value) => {
		if (value === undefined || value === '') {
			return undefined;
		}
		return value;
	}, z.string().min(1).default('.document-storage')),
});

export type Env = z.infer<typeof envSchema>;
