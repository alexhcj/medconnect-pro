import {applyDecorators, SetMetadata} from '@nestjs/common';
import {
	ApiExtraModels,
	ApiServiceUnavailableResponse,
	ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import {ErrorEnvelopeRdo, RateLimitedErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import type {RateLimitPolicy} from './rate-limit.policy.js';

export const RATE_LIMIT_POLICIES_KEY = 'rateLimitPolicies';

/** OpenAPI 429 (and 503 when a policy fails closed) for a rate-limited route. */
export const ApiRateLimited = (failClosed: boolean) =>
	applyDecorators(
		ApiExtraModels(RateLimitedErrorEnvelopeRdo),
		ApiTooManyRequestsResponse({
			type: RateLimitedErrorEnvelopeRdo,
			description: 'Rate limit exceeded. `Retry-After` gives seconds until the window resets.',
			headers: {'Retry-After': {schema: {type: 'integer', minimum: 1}}},
		}),
		...(failClosed
			? [
					ApiServiceUnavailableResponse({
						type: ErrorEnvelopeRdo,
						description: 'RATE_LIMIT_UNAVAILABLE: the rate limiter store is unavailable.',
					}),
				]
			: []),
	);

/** Opt-in per route; every listed policy applies and the first exceeded rejects. */
export const RateLimit = (...policies: RateLimitPolicy[]) =>
	applyDecorators(
		SetMetadata(RATE_LIMIT_POLICIES_KEY, policies),
		ApiRateLimited(policies.some((policy) => policy.failure === 'closed')),
	);
