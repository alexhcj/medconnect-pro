import type {ArgumentsHost} from '@nestjs/common';
import {describe, expect, it} from 'vitest';
import {RateLimitedError, RateLimitUnavailableError} from '../rate-limit/rate-limit.errors.js';
import {OAuthCallbackRateLimitFilter} from './oauth-callback-rate-limit.filter.js';

function createHost() {
	const headers: Record<string, string> = {};
	let location = '';
	let status = 0;
	const res = {
		setHeader(name: string, value: string) {
			headers[name.toLowerCase()] = value;
		},
		redirect(code: number, url: string) {
			status = code;
			location = url;
		},
	};
	const host = {switchToHttp: () => ({getResponse: () => res})} as unknown as ArgumentsHost;
	return {host, result: () => ({headers, location, status})};
}

const filter = new OAuthCallbackRateLimitFilter(
	() => 'http://web/login?reason=rate_limited',
	() => 'http://web/login?reason=oauth_failed',
);

describe('OAuthCallbackRateLimitFilter', () => {
	it('redirects throttling to the rate-limited reason with Retry-After', () => {
		const {host, result} = createHost();
		filter.catch(new RateLimitedError(17), host);
		expect(result()).toEqual({
			headers: {'retry-after': '17'},
			location: 'http://web/login?reason=rate_limited',
			status: 302,
		});
	});

	it('keeps a limiter outage on the generic failure reason', () => {
		const {host, result} = createHost();
		filter.catch(new RateLimitUnavailableError(), host);
		expect(result()).toEqual({headers: {}, location: 'http://web/login?reason=oauth_failed', status: 302});
	});
});
