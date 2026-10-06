import {describe, expect, it} from 'vitest';
import {CsrfInvalidError} from './auth.errors.js';
import {assertCookieMutationCsrf} from './csrf.js';
import {CSRF_COOKIE_NAME, CSRF_HEADER_NAME} from './session-cookies.js';

function mockRequest(input: {
	method: string;
	contentType?: string;
	csrfCookie?: string;
	csrfHeader?: string;
	cookieHeader?: string;
}): {method: string; header: (name: string) => string | undefined} {
	const cookies = input.cookieHeader
		?? (input.csrfCookie ? `${CSRF_COOKIE_NAME}=${input.csrfCookie}` : undefined);
	return {
		method: input.method,
		header(name: string) {
			const key = name.toLowerCase();
			if (key === 'content-type') {
				return input.contentType;
			}
			if (key === 'cookie') {
				return cookies;
			}
			if (key === CSRF_HEADER_NAME.toLowerCase()) {
				return input.csrfHeader;
			}
			return undefined;
		},
	};
}

describe('assertCookieMutationCsrf', () => {
	it('skips Bearer, GET, and requests that did not use cookie auth', () => {
		expect(() =>
			assertCookieMutationCsrf({
				request: mockRequest({method: 'POST'}) as never,
				appEnv: 'production',
				usedCookieAuth: false,
			}),
		).not.toThrow();
		expect(() =>
			assertCookieMutationCsrf({
				request: mockRequest({method: 'GET'}) as never,
				appEnv: 'production',
				usedCookieAuth: true,
			}),
		).not.toThrow();
	});

	it('requires JSON or multipart content type for cookie-authenticated mutations', () => {
		expect(() =>
			assertCookieMutationCsrf({
				request: mockRequest({
					method: 'POST',
					contentType: 'application/x-www-form-urlencoded',
				}) as never,
				appEnv: 'local',
				usedCookieAuth: true,
			}),
		).toThrow(CsrfInvalidError);
		expect(() =>
			assertCookieMutationCsrf({
				request: mockRequest({
					method: 'POST',
					contentType: 'application/json',
				}) as never,
				appEnv: 'local',
				usedCookieAuth: true,
			}),
		).not.toThrow();
		expect(() =>
			assertCookieMutationCsrf({
				request: mockRequest({
					method: 'POST',
					contentType: 'multipart/form-data; boundary=abc',
				}) as never,
				appEnv: 'local',
				usedCookieAuth: true,
			}),
		).not.toThrow();
	});

	it('requires a matching CSRF header only outside local', () => {
		expect(() =>
			assertCookieMutationCsrf({
				request: mockRequest({
					method: 'POST',
					contentType: 'application/json',
				}) as never,
				appEnv: 'local',
				usedCookieAuth: true,
			}),
		).not.toThrow();
		expect(() =>
			assertCookieMutationCsrf({
				request: mockRequest({
					method: 'POST',
					contentType: 'application/json',
					csrfCookie: 'csrf-secret',
					csrfHeader: 'csrf-secret',
				}) as never,
				appEnv: 'preview',
				usedCookieAuth: true,
			}),
		).not.toThrow();
		expect(() =>
			assertCookieMutationCsrf({
				request: mockRequest({
					method: 'POST',
					contentType: 'application/json',
					csrfCookie: 'csrf-secret',
					csrfHeader: 'other',
				}) as never,
				appEnv: 'production',
				usedCookieAuth: true,
			}),
		).toThrow(CsrfInvalidError);
		expect(() =>
			assertCookieMutationCsrf({
				request: mockRequest({
					method: 'POST',
					contentType: 'application/json',
				}) as never,
				appEnv: 'preview',
				usedCookieAuth: true,
			}),
		).toThrow(CsrfInvalidError);
	});
});
