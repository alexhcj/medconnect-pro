import type {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME} from '../src/identity/session-cookies.js';

export type FakeOAuthResult = {
	location: string;
	accessToken?: string;
	refreshToken?: string;
	setCookies: string[];
};

export function cookieValue(setCookies: string[], name: string): string | undefined {
	const entry = setCookies.find((cookie) => cookie.startsWith(`${name}=`));
	const raw = entry?.split(';')[0]?.slice(name.length + 1);
	return raw ? decodeURIComponent(raw) : undefined;
}

function headerList(value: string | string[] | undefined): string[] {
	if (!value) {
		return [];
	}
	return Array.isArray(value) ? value : [value];
}

/** Start URL for the Fake provider; returns the relative authorize location. */
export async function startFakeOAuth(app: INestApplication, returnTo?: string): Promise<string> {
	const query = returnTo === undefined ? '' : `?returnTo=${encodeURIComponent(returnTo)}`;
	const response = await request(app.getHttpServer())
		.get(`/auth/oauth/fake/start${query}`)
		.expect(302);
	return response.headers.location as string;
}

/** Fake authorize step; returns the relative callback location (code + state). */
export async function authorizeFakeOAuth(
	app: INestApplication,
	authorizeLocation: string,
	email: string,
): Promise<string> {
	const url = new URL(authorizeLocation, 'http://api.local');
	url.searchParams.set('login_hint', email);
	const response = await request(app.getHttpServer())
		.get(`${url.pathname}${url.search}`)
		.expect(302);
	return response.headers.location as string;
}

export async function completeFakeOAuth(
	app: INestApplication,
	callbackLocation: string,
): Promise<FakeOAuthResult> {
	const response = await request(app.getHttpServer()).get(callbackLocation).expect(302);
	const setCookies = headerList(response.headers['set-cookie']);
	return {
		location: response.headers.location as string,
		accessToken: cookieValue(setCookies, ACCESS_COOKIE_NAME),
		refreshToken: cookieValue(setCookies, REFRESH_COOKIE_NAME),
		setCookies,
	};
}

export async function runFakeOAuth(
	app: INestApplication,
	email: string,
	returnTo?: string,
): Promise<FakeOAuthResult> {
	const authorize = await startFakeOAuth(app, returnTo);
	const callback = await authorizeFakeOAuth(app, authorize, email);
	return completeFakeOAuth(app, callback);
}
