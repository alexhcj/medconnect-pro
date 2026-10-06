import type {Request} from 'express';
import type {AppEnvName} from '../platform/cors-origins.js';
import {CsrfInvalidError} from './auth.errors.js';
import {CSRF_COOKIE_NAME, CSRF_HEADER_NAME, readCookie} from './session-cookies.js';
import {constantTimeEqual} from './token.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isMutatingMethod(method: string): boolean {
	return !SAFE_METHODS.has(method.toUpperCase());
}

export function hasCookieMutationContentType(request: Request): boolean {
	const value = request.header('content-type') ?? '';
	return (
		/^application\/json(?:\s*;|$)/i.test(value) || /^multipart\/form-data(?:\s*;|$)/i.test(value)
	);
}

/**
 * Cookie-authenticated mutations must not be simple HTML form posts.
 * Hosted SameSite=None also requires a matching X-CSRF-Token header.
 * Bearer, safe methods, and requests that did not use cookie auth skip this check.
 */
export function assertCookieMutationCsrf(input: {
	request: Request;
	appEnv: AppEnvName;
	usedCookieAuth: boolean;
}): void {
	if (!input.usedCookieAuth || !isMutatingMethod(input.request.method)) {
		return;
	}
	if (!hasCookieMutationContentType(input.request)) {
		throw new CsrfInvalidError();
	}
	if (input.appEnv === 'local') {
		return;
	}
	const cookie = readCookie(input.request, CSRF_COOKIE_NAME);
	const header = input.request.header(CSRF_HEADER_NAME);
	if (!cookie || !header || !constantTimeEqual(cookie, header)) {
		throw new CsrfInvalidError();
	}
}
