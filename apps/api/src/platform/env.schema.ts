import {z} from 'zod';
import {
	DEFAULT_DATABASE_ADMIN_URL,
	DEFAULT_DATABASE_URL,
	isKnownLocalComposeDatabaseUrl,
	postgresUrlUsername,
} from '../persistence/default-database-url.js';
import {productionCorsRejection, splitOriginEntries} from './cors-origins.js';

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

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional());

/** Local/test only; hosted environments must set RATE_LIMIT_KEY_SECRET. */
export const DEV_RATE_LIMIT_KEY_SECRET = 'medconnect-local-rate-limit-key-secret-not-for-hosted';

const trustProxySchema = z.preprocess(
	emptyToUndefined,
	z
		.string()
		.regex(/^\d+$/, 'TRUST_PROXY must be a non-negative integer hop count')
		.transform(Number)
		.optional()
		.transform((value) => value ?? 0),
);

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
		WEB_ORIGIN: z.preprocess((value) => {
			if (value === undefined || value === '') {
				return undefined;
			}
			return value;
		}, z.string().min(1).optional()),
		WEB_ORIGINS: z.preprocess((value) => {
			if (value === undefined || value === '') {
				return undefined;
			}
			return value;
		}, z.string().min(1).optional()),
		DOCUMENT_S3_BUCKET: z.preprocess((value) => {
			if (value === undefined || value === '') {
				return undefined;
			}
			return value;
		}, z.string().min(1).optional()),
		DAILY_API_KEY: optionalString,
		OIDC_PROVIDER: z.preprocess(emptyToUndefined, z.enum(['google', 'fake']).optional()),
		OIDC_ISSUER: z.preprocess(emptyToUndefined, z.url().optional()),
		OIDC_CLIENT_ID: optionalString,
		OIDC_CLIENT_SECRET: optionalString,
		OIDC_REDIRECT_URI: z.preprocess(emptyToUndefined, z.url().optional()),
		OIDC_DEMO_EMAIL: optionalString,
		TRUST_PROXY: trustProxySchema,
		RATE_LIMIT_KEY_SECRET: z.preprocess(
			emptyToUndefined,
			z.string().min(32, 'RATE_LIMIT_KEY_SECRET must be at least 32 characters').optional(),
		),
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
		if (env.DATABASE_URL && env.DATABASE_ADMIN_URL) {
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
		}
		if (!env.RATE_LIMIT_KEY_SECRET) {
			ctx.addIssue({
				code: 'custom',
				path: ['RATE_LIMIT_KEY_SECRET'],
				message: 'RATE_LIMIT_KEY_SECRET is required when APP_ENV is preview or production',
			});
		}
		if (!env.DOCUMENT_S3_BUCKET) {
			ctx.addIssue({
				code: 'custom',
				path: ['DOCUMENT_S3_BUCKET'],
				message: 'DOCUMENT_S3_BUCKET is required when APP_ENV is preview or production',
			});
		}
		if (env.APP_ENV === 'production') {
			const corsRejection = productionCorsRejection(
				splitOriginEntries(env.WEB_ORIGIN, env.WEB_ORIGINS),
			);
			if (corsRejection) {
				ctx.addIssue({
					code: 'custom',
					path: ['WEB_ORIGINS'],
					message: corsRejection,
				});
			}
		}
	})
	.transform((env) => ({
		...env,
		DATABASE_URL: env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
		DATABASE_ADMIN_URL: env.DATABASE_ADMIN_URL ?? DEFAULT_DATABASE_ADMIN_URL,
		RATE_LIMIT_KEY_SECRET: env.RATE_LIMIT_KEY_SECRET ?? DEV_RATE_LIMIT_KEY_SECRET,
	}));

export function readTrustProxy(raw: string | undefined): number {
	return trustProxySchema.parse(raw);
}

export type Env = z.output<typeof envSchema>;
