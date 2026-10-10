import {Controller, Get} from '@nestjs/common';
import {Public} from '../src/identity/auth.decorators.js';
import {clientIp} from '../src/rate-limit/client-ip.js';
import {RateLimit} from '../src/rate-limit/rate-limit.decorator.js';
import type {RateLimitPolicy} from '../src/rate-limit/rate-limit.policy.js';

export const PROBE_LIMIT = 2;
export const PROBE_WINDOW_MS = 60_000;

const closedPolicy: RateLimitPolicy = {
	name: 'probe.closed',
	limit: PROBE_LIMIT,
	windowMs: PROBE_WINDOW_MS,
	failure: 'closed',
	key: clientIp,
};

const openPolicy: RateLimitPolicy = {...closedPolicy, name: 'probe.open', failure: 'open'};

@Public()
@Controller('__test/rate-limit')
export class RateLimitProbeController {
	@Get('closed')
	@RateLimit(closedPolicy)
	closed() {
		return {ok: true};
	}

	@Get('open')
	@RateLimit(openPolicy)
	open() {
		return {ok: true};
	}

	@Get('unlimited')
	unlimited() {
		return {ok: true};
	}
}
