import {describe, expect, it} from 'vitest';
import {
	DEFAULT_DATABASE_ADMIN_URL,
	DEFAULT_DATABASE_URL,
	isKnownLocalComposeDatabaseUrl,
} from '../persistence/default-database-url.js';
import {envSchema} from './env.schema.js';

const hostedRuntimeUrl =
	'postgresql://medconnect_app:hosted-runtime-secret@preview-db.example.internal:5432/medconnect';
const hostedAdminUrl =
	'postgresql://medconnect:hosted-admin-secret@preview-db.example.internal:5432/medconnect';
const hostedDocumentBucket = 'medconnect-preview-documents-example';

function hostedEnv(overrides: Record<string, string> = {}) {
	return {
		APP_ENV: 'preview',
		NODE_ENV: 'production',
		DATABASE_URL: hostedRuntimeUrl,
		DATABASE_ADMIN_URL: hostedAdminUrl,
		DOCUMENT_S3_BUCKET: hostedDocumentBucket,
		...overrides,
	};
}

function issueMessages(result: ReturnType<typeof envSchema.safeParse>): string[] {
	if (result.success) {
		return [];
	}
	return result.error.issues.map((issue) => issue.message);
}

describe('isKnownLocalComposeDatabaseUrl', () => {
	it('matches Compose runtime and owner defaults', () => {
		expect(isKnownLocalComposeDatabaseUrl(DEFAULT_DATABASE_URL)).toBe(true);
		expect(isKnownLocalComposeDatabaseUrl(DEFAULT_DATABASE_ADMIN_URL)).toBe(true);
	});

	it('matches postgres:// scheme and localhost hosts', () => {
		expect(
			isKnownLocalComposeDatabaseUrl(
				'postgres://medconnect_app:medconnect_app@127.0.0.1:5432/medconnect',
			),
		).toBe(true);
		expect(isKnownLocalComposeDatabaseUrl('postgresql://other:other@localhost:5432/other')).toBe(
			true,
		);
	});

	it('matches Compose user/password on a remote host', () => {
		expect(
			isKnownLocalComposeDatabaseUrl(
				'postgresql://medconnect_app:medconnect_app@preview-db.example.internal:5432/medconnect',
			),
		).toBe(true);
	});

	it('does not match a hosted URL with distinct credentials', () => {
		expect(isKnownLocalComposeDatabaseUrl(hostedRuntimeUrl)).toBe(false);
	});
});

describe('envSchema', () => {
	it('defaults APP_ENV to local and Compose database URLs', () => {
		const parsed = envSchema.safeParse({});
		expect(parsed.success).toBe(true);
		if (!parsed.success) {
			return;
		}
		expect(parsed.data.APP_ENV).toBe('local');
		expect(parsed.data.NODE_ENV).toBe('development');
		expect(parsed.data.DATABASE_URL).toBe(DEFAULT_DATABASE_URL);
		expect(parsed.data.DATABASE_ADMIN_URL).toBe(DEFAULT_DATABASE_ADMIN_URL);
	});

	it('allows NODE_ENV=test with APP_ENV=local', () => {
		const parsed = envSchema.safeParse({NODE_ENV: 'test'});
		expect(parsed.success).toBe(true);
		if (!parsed.success) {
			return;
		}
		expect(parsed.data.APP_ENV).toBe('local');
		expect(parsed.data.NODE_ENV).toBe('test');
	});

	it('refuses preview boot when database URLs are missing', () => {
		const parsed = envSchema.safeParse({APP_ENV: 'preview', NODE_ENV: 'production'});
		expect(parsed.success).toBe(false);
		const messages = issueMessages(parsed);
		expect(messages).toContain('DATABASE_URL is required when APP_ENV is preview or production');
		expect(messages).toContain(
			'DATABASE_ADMIN_URL is required when APP_ENV is preview or production',
		);
	});

	it('refuses production boot when URLs match Compose demo credentials', () => {
		const parsed = envSchema.safeParse({
			APP_ENV: 'production',
			NODE_ENV: 'production',
			DATABASE_URL: DEFAULT_DATABASE_URL,
			DATABASE_ADMIN_URL: DEFAULT_DATABASE_ADMIN_URL,
		});
		expect(parsed.success).toBe(false);
		const messages = issueMessages(parsed);
		expect(messages).toContain(
			'DATABASE_URL must not use known local Compose credentials when APP_ENV is preview or production',
		);
		expect(messages).toContain(
			'DATABASE_ADMIN_URL must not use known local Compose credentials when APP_ENV is preview or production',
		);
	});

	it('refuses preview boot when NODE_ENV is not production', () => {
		const parsed = envSchema.safeParse(hostedEnv({NODE_ENV: 'development'}));
		expect(parsed.success).toBe(false);
		expect(issueMessages(parsed)).toContain('NODE_ENV must be production when APP_ENV is preview');
	});

	it('accepts preview with valid hosted URLs', () => {
		const parsed = envSchema.safeParse(hostedEnv());
		expect(parsed.success).toBe(true);
		if (!parsed.success) {
			return;
		}
		expect(parsed.data.APP_ENV).toBe('preview');
		expect(parsed.data.DATABASE_URL).toBe(hostedRuntimeUrl);
		expect(parsed.data.DATABASE_ADMIN_URL).toBe(hostedAdminUrl);
		expect(parsed.data.DOCUMENT_S3_BUCKET).toBe(hostedDocumentBucket);
	});

	it('accepts production with valid hosted URLs', () => {
		const productionRuntime =
			'postgresql://medconnect_app:prod-runtime-secret@prod-db.example.internal:5432/medconnect';
		const productionAdmin =
			'postgresql://medconnect:prod-admin-secret@prod-db.example.internal:5432/medconnect';
		const parsed = envSchema.safeParse(
			hostedEnv({
				APP_ENV: 'production',
				DATABASE_URL: productionRuntime,
				DATABASE_ADMIN_URL: productionAdmin,
				DOCUMENT_S3_BUCKET: 'medconnect-production-documents-example',
			}),
		);
		expect(parsed.success).toBe(true);
		if (!parsed.success) {
			return;
		}
		expect(parsed.data.APP_ENV).toBe('production');
		expect(parsed.data.DATABASE_URL).toBe(productionRuntime);
	});

	it('refuses hosted boot when DOCUMENT_S3_BUCKET is missing', () => {
		const parsed = envSchema.safeParse({
			APP_ENV: 'preview',
			NODE_ENV: 'production',
			DATABASE_URL: hostedRuntimeUrl,
			DATABASE_ADMIN_URL: hostedAdminUrl,
		});
		expect(parsed.success).toBe(false);
		expect(issueMessages(parsed)).toContain(
			'DOCUMENT_S3_BUCKET is required when APP_ENV is preview or production',
		);
	});

	it('refuses hosted boot when runtime and owner URLs are identical', () => {
		const parsed = envSchema.safeParse(hostedEnv({DATABASE_ADMIN_URL: hostedRuntimeUrl}));
		expect(parsed.success).toBe(false);
		const messages = issueMessages(parsed);
		expect(messages).toContain(
			'DATABASE_URL must not equal DATABASE_ADMIN_URL when APP_ENV is preview or production',
		);
		expect(messages).toContain(
			'DATABASE_ADMIN_URL must not use the medconnect_app runtime role when APP_ENV is preview or production',
		);
	});

	it('refuses hosted boot when DATABASE_URL is not medconnect_app', () => {
		const parsed = envSchema.safeParse(
			hostedEnv({
				APP_ENV: 'production',
				DATABASE_URL:
					'postgresql://medconnect:hosted-admin-secret@prod-db.example.internal:5432/medconnect',
			}),
		);
		expect(parsed.success).toBe(false);
		expect(issueMessages(parsed)).toContain(
			'DATABASE_URL username must be medconnect_app when APP_ENV is preview or production',
		);
	});

	it('refuses production boot when CORS allows localhost', () => {
		const parsed = envSchema.safeParse(
			hostedEnv({
				APP_ENV: 'production',
				DATABASE_URL: hostedRuntimeUrl.replace('preview-db', 'prod-db'),
				DATABASE_ADMIN_URL: hostedAdminUrl.replace('preview-db', 'prod-db'),
				WEB_ORIGIN: 'http://localhost:3000',
			}),
		);
		expect(parsed.success).toBe(false);
		expect(issueMessages(parsed)).toContain('Production CORS must not allow localhost origins');
	});

	it('refuses production boot when CORS uses the Amplify preview host pattern', () => {
		const parsed = envSchema.safeParse(
			hostedEnv({
				APP_ENV: 'production',
				DATABASE_URL: hostedRuntimeUrl.replace('preview-db', 'prod-db'),
				DATABASE_ADMIN_URL: hostedAdminUrl.replace('preview-db', 'prod-db'),
				WEB_ORIGINS: 'https://*.amplifyapp.com',
			}),
		);
		expect(parsed.success).toBe(false);
		expect(issueMessages(parsed)).toContain(
			'Production CORS must not allow preview hostname patterns',
		);
	});

	it('accepts preview CORS with the Amplify preview host pattern', () => {
		const parsed = envSchema.safeParse(
			hostedEnv({WEB_ORIGINS: 'https://*.amplifyapp.com'}),
		);
		expect(parsed.success).toBe(true);
	});
});
