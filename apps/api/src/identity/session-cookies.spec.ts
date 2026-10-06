import {describe, expect, it} from 'vitest';
import {
	ACCESS_COOKIE_NAME,
	ACCESS_COOKIE_PATH,
	CSRF_COOKIE_NAME,
	MFA_COOKIE_NAME,
	REFRESH_COOKIE_NAME,
	REFRESH_COOKIE_PATH,
	applyMfaCookie,
	applySessionCookies,
	clearSessionCookies,
	parseCookieHeader,
	resolveSessionCookieFlags,
	resolveSessionCookieOptions,
} from './session-cookies.js';
import {ABSOLUTE_TTL_MS, ACCESS_TTL_MS, MFA_TTL_MS} from './session-policy.js';

type RecordedCookie = {
	name: string;
	value: string;
	options: Record<string, unknown>;
};

function mockResponse() {
	const set: RecordedCookie[] = [];
	const cleared: Array<{name: string; options: Record<string, unknown>}> = [];
	return {
		set,
		cleared,
		cookie(name: string, value: string, options: Record<string, unknown>) {
			set.push({name, value, options});
		},
		clearCookie(name: string, options: Record<string, unknown>) {
			cleared.push({name, options});
		},
	};
}

describe('resolveSessionCookieFlags', () => {
	it('uses HttpOnly Lax cookies without Secure in local', () => {
		expect(resolveSessionCookieFlags('local')).toEqual({
			httpOnly: true,
			secure: false,
			sameSite: 'lax',
		});
	});

	it('uses Secure SameSite=None outside local', () => {
		expect(resolveSessionCookieFlags('preview')).toEqual({
			httpOnly: true,
			secure: true,
			sameSite: 'none',
		});
		expect(resolveSessionCookieFlags('production')).toEqual({
			httpOnly: true,
			secure: true,
			sameSite: 'none',
		});
	});
});

describe('resolveSessionCookieOptions', () => {
	it('scopes access, refresh, and MFA cookies and never sets Domain', () => {
		const local = resolveSessionCookieOptions('local');
		expect(local.access).toMatchObject({
			httpOnly: true,
			secure: false,
			sameSite: 'lax',
			path: ACCESS_COOKIE_PATH,
			maxAge: ACCESS_TTL_MS,
		});
		expect(local.refresh).toMatchObject({
			httpOnly: true,
			path: REFRESH_COOKIE_PATH,
			maxAge: ABSOLUTE_TTL_MS,
		});
		expect(local.mfa).toMatchObject({
			httpOnly: true,
			maxAge: MFA_TTL_MS,
		});
		expect(local.csrf.httpOnly).toBe(false);
		expect(local.access).not.toHaveProperty('domain');
	});

	it('does not set Secure for local and sets SameSite=None only when hosted', () => {
		expect(resolveSessionCookieOptions('local').access.secure).toBe(false);
		expect(resolveSessionCookieOptions('local').access.sameSite).toBe('lax');
		expect(resolveSessionCookieOptions('preview').access.secure).toBe(true);
		expect(resolveSessionCookieOptions('preview').access.sameSite).toBe('none');
		expect(resolveSessionCookieOptions('production').csrf.secure).toBe(true);
		expect(resolveSessionCookieOptions('production').csrf.sameSite).toBe('none');
	});
});

describe('parseCookieHeader', () => {
	it('parses named cookies and skips empty segments', () => {
		expect(parseCookieHeader(`${ACCESS_COOKIE_NAME}=abc; ${REFRESH_COOKIE_NAME}=def`)).toEqual({
			[ACCESS_COOKIE_NAME]: 'abc',
			[REFRESH_COOKIE_NAME]: 'def',
		});
		expect(parseCookieHeader(undefined)).toEqual({});
	});
});

describe('applySessionCookies', () => {
	it('sets access and refresh locally and omits the CSRF cookie', () => {
		const response = mockResponse();
		applySessionCookies(
			response as never,
			{accessToken: 'access', refreshToken: 'refresh'},
			'local',
		);
		expect(response.set.map((cookie) => cookie.name)).toEqual([
			ACCESS_COOKIE_NAME,
			REFRESH_COOKIE_NAME,
		]);
		expect(response.set[0]?.options.httpOnly).toBe(true);
	});

	it('adds a non-HttpOnly CSRF cookie when hosted', () => {
		const response = mockResponse();
		applySessionCookies(
			response as never,
			{accessToken: 'access', refreshToken: 'refresh'},
			'preview',
		);
		const csrf = response.set.find((cookie) => cookie.name === CSRF_COOKIE_NAME);
		expect(csrf?.options.httpOnly).toBe(false);
		expect(csrf?.value.length).toBeGreaterThan(8);
	});
});

describe('applyMfaCookie and clearSessionCookies', () => {
	it('sets the MFA cookie and clears session cookies with matching paths', () => {
		const response = mockResponse();
		applyMfaCookie(response as never, 'mfa-token', 'local');
		expect(response.set[0]).toMatchObject({
			name: MFA_COOKIE_NAME,
			value: 'mfa-token',
		});
		clearSessionCookies(response as never, 'local');
		expect(response.cleared.map((cookie) => cookie.name)).toEqual([
			ACCESS_COOKIE_NAME,
			REFRESH_COOKIE_NAME,
			MFA_COOKIE_NAME,
		]);
		expect(response.cleared.find((cookie) => cookie.name === ACCESS_COOKIE_NAME)?.options.path).toBe(
			ACCESS_COOKIE_PATH,
		);
	});
});
