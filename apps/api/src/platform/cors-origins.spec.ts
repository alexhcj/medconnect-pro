import {describe, expect, it} from 'vitest';
import {
	AMPLIFY_PREVIEW_HOST_PATTERN,
	DEFAULT_LOCAL_WEB_ORIGIN,
	isCorsOriginAllowed,
	productionCorsRejection,
	resolveAppEnv,
	resolveCorsOriginPolicy,
	splitOriginEntries,
} from './cors-origins.js';

describe('splitOriginEntries', () => {
	it('unions WEB_ORIGIN and comma-separated WEB_ORIGINS and trims duplicates', () => {
		expect(
			splitOriginEntries(
				' https://app.example.com ',
				'https://pr-1.d1.amplifyapp.com, https://app.example.com,https://pr-2.d1.amplifyapp.com',
			),
		).toEqual([
			'https://app.example.com',
			'https://pr-1.d1.amplifyapp.com',
			'https://pr-2.d1.amplifyapp.com',
		]);
	});

	it('returns an empty list when both values are blank', () => {
		expect(splitOriginEntries(undefined, '  , ')).toEqual([]);
	});
});

describe('productionCorsRejection', () => {
	it('rejects localhost', () => {
		expect(productionCorsRejection([DEFAULT_LOCAL_WEB_ORIGIN])).toBe(
			'Production CORS must not allow localhost origins',
		);
		expect(productionCorsRejection(['http://127.0.0.1:3000'])).toBe(
			'Production CORS must not allow localhost origins',
		);
	});

	it('rejects the Amplify preview host pattern and other wildcards', () => {
		expect(productionCorsRejection([AMPLIFY_PREVIEW_HOST_PATTERN])).toBe(
			'Production CORS must not allow preview hostname patterns',
		);
		expect(productionCorsRejection(['https://*.example.com'])).toBe(
			'Production CORS must not allow preview hostname patterns',
		);
	});

	it('allows an exact production origin', () => {
		expect(productionCorsRejection(['https://app.example.com'])).toBeUndefined();
	});
});

describe('resolveCorsOriginPolicy', () => {
	it('defaults local to localhost:3000', () => {
		const policy = resolveCorsOriginPolicy({appEnv: 'local'});
		expect([...policy.exact]).toEqual([DEFAULT_LOCAL_WEB_ORIGIN]);
		expect(policy.allowAmplifyPreviewHosts).toBe(false);
		expect(isCorsOriginAllowed(policy, DEFAULT_LOCAL_WEB_ORIGIN)).toBe(true);
		expect(isCorsOriginAllowed(policy, 'https://pr-1.d1.amplifyapp.com')).toBe(false);
	});

	it('allows listed preview origins and the Amplify preview host pattern', () => {
		const policy = resolveCorsOriginPolicy({
			appEnv: 'preview',
			webOrigin: 'https://preview.example.com',
			webOrigins: AMPLIFY_PREVIEW_HOST_PATTERN,
		});
		expect(policy.allowAmplifyPreviewHosts).toBe(true);
		expect(isCorsOriginAllowed(policy, 'https://preview.example.com')).toBe(true);
		expect(isCorsOriginAllowed(policy, 'https://pr-12.dabc123.amplifyapp.com')).toBe(true);
		expect(isCorsOriginAllowed(policy, 'http://pr-12.dabc123.amplifyapp.com')).toBe(false);
		expect(isCorsOriginAllowed(policy, 'https://evil.example.com')).toBe(false);
		expect(isCorsOriginAllowed(policy, DEFAULT_LOCAL_WEB_ORIGIN)).toBe(false);
	});

	it('allows only exact production origins', () => {
		const policy = resolveCorsOriginPolicy({
			appEnv: 'production',
			webOrigin: 'https://app.example.com',
		});
		expect(policy.allowAmplifyPreviewHosts).toBe(false);
		expect(isCorsOriginAllowed(policy, 'https://app.example.com')).toBe(true);
		expect(isCorsOriginAllowed(policy, 'https://pr-12.dabc123.amplifyapp.com')).toBe(false);
		expect(isCorsOriginAllowed(policy, DEFAULT_LOCAL_WEB_ORIGIN)).toBe(false);
	});

	it('allows non-browser requests with no Origin header', () => {
		const policy = resolveCorsOriginPolicy({appEnv: 'production', webOrigin: 'https://app.example.com'});
		expect(isCorsOriginAllowed(policy, undefined)).toBe(true);
	});
});

describe('resolveAppEnv', () => {
	it('treats missing and unknown APP_ENV as local', () => {
		expect(resolveAppEnv({})).toBe('local');
		expect(resolveAppEnv({APP_ENV: 'development'})).toBe('local');
		expect(resolveAppEnv({APP_ENV: 'preview'})).toBe('preview');
		expect(resolveAppEnv({APP_ENV: 'production'})).toBe('production');
	});
});
