import type {CookieOptions, Request, Response} from 'express';
import type {AppEnvName} from '../platform/cors-origins.js';
import {ABSOLUTE_TTL_MS, ACCESS_TTL_MS, MFA_TTL_MS} from './session-policy.js';
import {generateToken} from './token.js';

export const ACCESS_COOKIE_NAME = 'mcp_access';
export const REFRESH_COOKIE_NAME = 'mcp_refresh';
export const MFA_COOKIE_NAME = 'mcp_mfa';
export const CSRF_COOKIE_NAME = 'mcp_csrf';
export const CSRF_HEADER_NAME = 'X-CSRF-Token';

export const ACCESS_COOKIE_PATH = '/';
export const REFRESH_COOKIE_PATH = '/auth';
export const MFA_COOKIE_PATH = '/auth';
export const CSRF_COOKIE_PATH = '/';

const PUBLIC_API_PREFIX_PATTERN = /^\/[A-Za-z0-9_-]+$/;

/**
 * Optional same-origin proxy prefix (`/mcp-api`). Empty keeps the historical paths.
 * The CSRF cookie stays on `/` so application pages can read it; access, refresh, and
 * MFA cookies must match the proxy path or the browser will not send them.
 */
export function readPublicApiPrefix(raw: string | undefined = process.env.PUBLIC_API_PREFIX): string {
	if (raw === undefined || raw.trim() === '') {
		return '';
	}
	const value = raw.trim();
	if (!PUBLIC_API_PREFIX_PATTERN.test(value)) {
		throw new Error('PUBLIC_API_PREFIX must be a single URL path segment');
	}
	return value;
}

export function prefixCookiePath(path: string, prefix: string): string {
	if (!prefix) {
		return path;
	}
	if (path === '/') {
		return prefix;
	}
	return `${prefix}${path.startsWith('/') ? path : `/${path}`}`;
}

export type SessionCookieFlags = {
	httpOnly: boolean;
	secure: boolean;
	sameSite: 'lax' | 'none';
};

export type SessionCookieOptions = {
	access: CookieOptions;
	refresh: CookieOptions;
	mfa: CookieOptions;
	csrf: CookieOptions;
};

export function resolveSessionCookieFlags(appEnv: AppEnvName): SessionCookieFlags {
	const local = appEnv === 'local';
	return {
		httpOnly: true,
		secure: !local,
		sameSite: local ? 'lax' : 'none',
	};
}

function cookieOptions(
	appEnv: AppEnvName,
	path: string,
	maxAge: number,
	httpOnly: boolean,
): CookieOptions {
	const flags = resolveSessionCookieFlags(appEnv);
	return {
		httpOnly,
		secure: flags.secure,
		sameSite: flags.sameSite,
		path,
		maxAge,
	};
}

export function resolveSessionCookieOptions(
	appEnv: AppEnvName,
	prefix = readPublicApiPrefix(),
): SessionCookieOptions {
	return {
		access: cookieOptions(appEnv, prefixCookiePath(ACCESS_COOKIE_PATH, prefix), ACCESS_TTL_MS, true),
		refresh: cookieOptions(
			appEnv,
			prefixCookiePath(REFRESH_COOKIE_PATH, prefix),
			ABSOLUTE_TTL_MS,
			true,
		),
		mfa: cookieOptions(appEnv, prefixCookiePath(MFA_COOKIE_PATH, prefix), MFA_TTL_MS, true),
		csrf: cookieOptions(appEnv, CSRF_COOKIE_PATH, ABSOLUTE_TTL_MS, false),
	};
}

export function parseCookieHeader(header: string | undefined): Record<string, string> {
	if (!header) {
		return {};
	}
	const cookies: Record<string, string> = {};
	for (const part of header.split(';')) {
		const separator = part.indexOf('=');
		if (separator <= 0) {
			continue;
		}
		const name = part.slice(0, separator).trim();
		const raw = part.slice(separator + 1).trim();
		if (!name) {
			continue;
		}
		try {
			cookies[name] = decodeURIComponent(raw);
		} catch {
			cookies[name] = raw;
		}
	}
	return cookies;
}

export function readCookie(request: Request, name: string): string | undefined {
	const value = parseCookieHeader(request.header('cookie'))[name];
	return value && value.length > 0 ? value : undefined;
}

export function applySessionCookies(
	response: Response,
	tokens: {accessToken: string; refreshToken: string},
	appEnv: AppEnvName,
	prefix = readPublicApiPrefix(),
): void {
	const options = resolveSessionCookieOptions(appEnv, prefix);
	response.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, options.access);
	response.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, options.refresh);
	if (appEnv !== 'local') {
		response.cookie(CSRF_COOKIE_NAME, generateToken(), options.csrf);
	}
}

export function applyMfaCookie(
	response: Response,
	mfaToken: string,
	appEnv: AppEnvName,
	prefix = readPublicApiPrefix(),
): void {
	response.cookie(MFA_COOKIE_NAME, mfaToken, resolveSessionCookieOptions(appEnv, prefix).mfa);
}

function clearCookie(
	response: Response,
	name: string,
	options: CookieOptions,
): void {
	response.clearCookie(name, {
		httpOnly: options.httpOnly,
		secure: options.secure,
		sameSite: options.sameSite,
		path: options.path,
	});
}

export function clearMfaCookie(
	response: Response,
	appEnv: AppEnvName,
	prefix = readPublicApiPrefix(),
): void {
	clearCookie(response, MFA_COOKIE_NAME, resolveSessionCookieOptions(appEnv, prefix).mfa);
}

export function clearSessionCookies(
	response: Response,
	appEnv: AppEnvName,
	prefix = readPublicApiPrefix(),
): void {
	const options = resolveSessionCookieOptions(appEnv, prefix);
	clearCookie(response, ACCESS_COOKIE_NAME, options.access);
	clearCookie(response, REFRESH_COOKIE_NAME, options.refresh);
	clearCookie(response, MFA_COOKIE_NAME, options.mfa);
	if (appEnv !== 'local') {
		clearCookie(response, CSRF_COOKIE_NAME, options.csrf);
	}
}
