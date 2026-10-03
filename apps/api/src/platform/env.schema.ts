import {z} from 'zod';
import {
	DEFAULT_DATABASE_ADMIN_URL,
	DEFAULT_DATABASE_URL,
	isKnownLocalComposeDatabaseUrl,
	postgresUrlUsername,
} from '../persistence/default-database-url.js';

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

const optionalPostgresUrl = (label: string) =>
	z.preprocess((value) => {
		if (value === undefined || value === '') {
			return undefined;
		}
		return value;
	}, z.string().regex(/^postgres(ql)?:\/\//, `${label} must be a PostgreSQL connection URL`).optional());

function addHostedDatabaseIssue(
	ctx: z.RefinementCtx,
	key: 'DATABASE_URL' | 'DATABASE_ADMIN_URL',
	value: string | undefined,
): void {
	if (value === undefined) {
		ctx.addIssue({
			code: 'custom',
			path: [key],
			message: `${key} is required when APP_ENV is preview or production`,
		});
		return;
	}
	if (isKnownLocalComposeDatabaseUrl(value)) {
		ctx.addIssue({
			code: 'custom',
			path: [key],
			message: `${key} must not use known local Compose credentials when APP_ENV is preview or production`,
		});
	}
}

export const envSchema = z
	.object({
		APP_ENV: z.enum(['local', 'preview', 'production']).default('local'),
		NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
		PORT: z.coerce.number().int().positive().default(3001),
		SWAGGER_UI_ENABLED: booleanFromEnv,
		DATABASE_URL: optionalPostgresUrl('DATABASE_URL'),
		DATABASE_ADMIN_URL: optionalPostgresUrl('DATABASE_ADMIN_URL'),
		DOCUMENT_STORAGE_DIR: z.preprocess((value) => {
			if (value === undefined || value === '') {
				return undefined;
			}
			return value;
		}, z.string().min(1).default('.document-storage')),
	})
	.superRefine((env, ctx) => {
		if (env.APP_ENV !== 'preview' && env.APP_ENV !== 'production') {
			return;
		}
		if (env.NODE_ENV !== 'production') {
			ctx.addIssue({
				code: 'custom',
				path: ['NODE_ENV'],
				message: `NODE_ENV must be production when APP_ENV is ${env.APP_ENV}`,
			});
		}
		addHostedDatabaseIssue(ctx, 'DATABASE_URL', env.DATABASE_URL);
		addHostedDatabaseIssue(ctx, 'DATABASE_ADMIN_URL', env.DATABASE_ADMIN_URL);
		if (!env.DATABASE_URL || !env.DATABASE_ADMIN_URL) {
			return;
		}
		if (env.DATABASE_URL === env.DATABASE_ADMIN_URL) {
			ctx.addIssue({
				code: 'custom',
				path: ['DATABASE_URL'],
				message:
					'DATABASE_URL must not equal DATABASE_ADMIN_URL when APP_ENV is preview or production',
			});
		}
		if (postgresUrlUsername(env.DATABASE_URL) !== 'medconnect_app') {
			ctx.addIssue({
				code: 'custom',
				path: ['DATABASE_URL'],
				message:
					'DATABASE_URL username must be medconnect_app when APP_ENV is preview or production',
			});
		}
		if (postgresUrlUsername(env.DATABASE_ADMIN_URL) === 'medconnect_app') {
			ctx.addIssue({
				code: 'custom',
				path: ['DATABASE_ADMIN_URL'],
				message:
					'DATABASE_ADMIN_URL must not use the medconnect_app runtime role when APP_ENV is preview or production',
			});
		}
	})
	.transform((env) => ({
		...env,
		DATABASE_URL: env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
		DATABASE_ADMIN_URL: env.DATABASE_ADMIN_URL ?? DEFAULT_DATABASE_ADMIN_URL,
	}));

export type Env = z.output<typeof envSchema>;
