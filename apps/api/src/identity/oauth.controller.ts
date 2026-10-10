import {
	Controller,
	Get,
	HttpException,
	HttpStatus,
	Inject,
	NotFoundException,
	Param,
	Query,
	Res,
	UseFilters,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiExcludeEndpoint,
	ApiFoundResponse,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiServiceUnavailableResponse,
	ApiTags,
} from '@nestjs/swagger';
import type {Response} from 'express';
import {DEFAULT_LOCAL_WEB_ORIGIN, resolveAppEnv} from '../platform/cors-origins.js';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {RateLimit} from '../rate-limit/rate-limit.decorator.js';
import {RATE_LIMIT_POLICIES} from '../rate-limit/rate-limit.policies.js';
import {Public} from './auth.decorators.js';
import {OAuthCallbackRateLimitFilter} from './oauth-callback-rate-limit.filter.js';
import {
	OAuthBadRequestError,
	OAuthService,
	OAuthUnavailableError,
} from './oauth.service.js';
import {FakeOidcAdapter} from './oidc/fake-oidc.adapter.js';
import {OIDC_PROVIDER_PORT, type OidcProviderPort} from './oidc/oidc-provider.port.js';
import {applySessionCookies} from './session-cookies.js';

export const OAUTH_COMPLETE_PATH = '/login/oauth/complete';
export const OAUTH_FAILED_PATH = '/login?reason=oauth_failed';

function single(value: unknown): string | undefined {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function webOrigin(): string {
	return (process.env.WEB_ORIGIN || DEFAULT_LOCAL_WEB_ORIGIN).replace(/\/+$/, '');
}

@ApiTags('auth')
@Controller('auth/oauth')
export class OAuthController {
	constructor(
		private readonly oauth: OAuthService,
		@Inject(OIDC_PROVIDER_PORT) private readonly provider: OidcProviderPort,
	) {}

	@Get('fake/authorize')
	@Public()
	@RateLimit(RATE_LIMIT_POLICIES.oauthFakeAuthorize)
	@ApiExcludeEndpoint()
	fakeAuthorize(
		@Query('state') state: unknown,
		@Query('code_challenge') codeChallenge: unknown,
		@Query('nonce') nonce: unknown,
		@Query('login_hint') loginHint: unknown,
		@Res() response: Response,
	): void {
		if (!(this.provider instanceof FakeOidcAdapter)) {
			throw new NotFoundException();
		}
		const stateValue = single(state);
		const challenge = single(codeChallenge);
		const nonceValue = single(nonce);
		if (!stateValue || !challenge || !nonceValue) {
			throw new HttpException(
				{code: 'VALIDATION_ERROR', message: 'Fake authorize requires state, code_challenge, and nonce'},
				HttpStatus.BAD_REQUEST,
			);
		}
		const code = this.provider.authorize({
			codeChallenge: challenge,
			nonce: nonceValue,
			email: single(loginHint),
		});
		const params = new URLSearchParams({code, state: stateValue});
		response.redirect(HttpStatus.FOUND, `/auth/oauth/fake/callback?${params.toString()}`);
	}

	@Get(':provider/start')
	@Public()
	@RateLimit(RATE_LIMIT_POLICIES.oauthStart)
	@ApiOperation({
		summary: 'Start demo OIDC sign-in',
		description:
			'Creates one-time state, a PKCE S256 verifier, and a nonce, then redirects to the provider authorize URL. Demo integration; not production OAuth or HIPAA identity.',
	})
	@ApiParam({name: 'provider', enum: ['google', 'fake']})
	@ApiQuery({
		name: 'returnTo',
		required: false,
		description: 'Relative in-app path under /dashboard. Absolute or off-allowlist values are rejected.',
	})
	@ApiFoundResponse({description: 'Redirect to the provider authorize URL.'})
	@ApiBadRequestResponse({type: ErrorEnvelopeRdo})
	@ApiServiceUnavailableResponse({type: ErrorEnvelopeRdo})
	async start(
		@Param('provider') provider: string,
		@Query('returnTo') returnTo: unknown,
		@Res() response: Response,
	): Promise<void> {
		if (returnTo !== undefined && typeof returnTo !== 'string') {
			throw badRequest('returnTo must be a relative in-app path');
		}
		let location: string;
		try {
			location = await this.oauth.start(provider, returnTo);
		} catch (error) {
			if (error instanceof OAuthUnavailableError) {
				throw new HttpException(
					{code: 'OAUTH_UNAVAILABLE', message: error.message},
					HttpStatus.SERVICE_UNAVAILABLE,
				);
			}
			if (error instanceof OAuthBadRequestError) {
				throw badRequest(error.message);
			}
			throw error;
		}
		response.redirect(HttpStatus.FOUND, location);
	}

	@Get(':provider/callback')
	@Public()
	@RateLimit(RATE_LIMIT_POLICIES.oauthCallback)
	@UseFilters(new OAuthCallbackRateLimitFilter(() => `${webOrigin()}${OAUTH_FAILED_PATH}`))
	@ApiOperation({
		summary: 'Complete demo OIDC sign-in',
		description:
			'Consumes state, exchanges the code with the PKCE verifier, validates the ID token, maps to a provisioned user, and sets the same HttpOnly session cookies as password login. Any failure redirects to /login?reason=oauth_failed with no provider detail. Rate limiting also redirects there (with Retry-After) instead of returning the documented 429/503 JSON.',
	})
	@ApiParam({name: 'provider', enum: ['google', 'fake']})
	@ApiFoundResponse({description: 'Redirect to the web OAuth complete page or the generic failure page.'})
	async callback(
		@Param('provider') provider: string,
		@Query('code') code: unknown,
		@Query('state') state: unknown,
		@Query('error') error: unknown,
		@Res() response: Response,
	): Promise<void> {
		const origin = webOrigin();
		try {
			const result = await this.oauth.callback(provider, {
				code: single(code),
				state: single(state),
				error: single(error),
			});
			applySessionCookies(response, result.tokens, resolveAppEnv());
			const params = new URLSearchParams({returnTo: result.returnTo});
			response.redirect(HttpStatus.FOUND, `${origin}${OAUTH_COMPLETE_PATH}?${params.toString()}`);
		} catch (failure) {
			await this.oauth.recordFailure(failure).catch(() => undefined);
			response.redirect(HttpStatus.FOUND, `${origin}${OAUTH_FAILED_PATH}`);
		}
	}
}

function badRequest(message: string): HttpException {
	return new HttpException({code: 'VALIDATION_ERROR', message}, HttpStatus.BAD_REQUEST);
}
