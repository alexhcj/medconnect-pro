import {describe, expect, it, vi} from 'vitest';
import {createSecurityHeadersMiddleware, isNoStorePath} from './security-headers.middleware.js';

function run(appEnv: 'local' | 'preview' | 'production', path: string) {
	const headers = new Map<string, string>();
	const res = {setHeader: (name: string, value: string) => headers.set(name, value)};
	const next = vi.fn();
	createSecurityHeadersMiddleware(appEnv)({path} as never, res as never, next);
	expect(next).toHaveBeenCalledOnce();
	return headers;
}

describe('createSecurityHeadersMiddleware', () => {
	it('sets baseline headers and omits HSTS locally', () => {
		const headers = run('local', '/health');
		expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(headers.get('Referrer-Policy')).toBe('no-referrer');
		expect(headers.get('X-Frame-Options')).toBe('DENY');
		expect(headers.get('Content-Security-Policy')).toBe("frame-ancestors 'none'");
		expect(headers.has('Strict-Transport-Security')).toBe(false);
		expect(headers.has('Cache-Control')).toBe(false);
	});

	it.each(['preview', 'production'] as const)('sends HSTS for %s', (appEnv) => {
		expect(run(appEnv, '/health').get('Strict-Transport-Security')).toBe(
			'max-age=31536000; includeSubDomains',
		);
	});

	it('sets no-store on auth and media-token paths only', () => {
		expect(run('local', '/auth/login').get('Cache-Control')).toBe('no-store');
	});
});

describe('isNoStorePath', () => {
	it.each(['/auth/login', '/auth/session', '/auth/oauth/google/callback', '/telehealth/sessions/x/media-token'])(
		'matches %s',
		(path) => expect(isNoStorePath(path)).toBe(true),
	);

	it.each(['/patients', '/telehealth/sessions/x/join', '/telehealth/sessions', '/authz'])(
		'does not match %s',
		(path) => expect(isNoStorePath(path)).toBe(false),
	);
});
