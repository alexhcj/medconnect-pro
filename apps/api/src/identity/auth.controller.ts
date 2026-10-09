import {Body, Controller, Get, HttpCode, Post, Req, Res} from '@nestjs/common';
import {
	ApiBody,
	ApiExtraModels,
	ApiForbiddenResponse,
	ApiNoContentResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
	getSchemaPath,
} from '@nestjs/swagger';
import type {Request, Response} from 'express';
import {resolveAppEnv} from '../platform/cors-origins.js';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {SessionInvalidError} from './auth.errors.js';
import {ApiSessionAuth, Public} from './auth.decorators.js';
import type {RequestAuth} from './auth.guard.js';
import {AuthSessionInfoRdo, LoginRequestRdo, MfaChallengeRdo, MfaVerifyRequestRdo, RefreshRequestRdo, TokenPairRdo} from './auth.rdo.js';
import {loginSchema, mfaVerifySchema, refreshSchema, type LoginBody, type MfaVerifyBody, type RefreshBody} from './auth.schema.js';
import {AuthService} from './auth.service.js';
import {assertCookieMutationCsrf} from './csrf.js';
import {
	MFA_COOKIE_NAME,
	REFRESH_COOKIE_NAME,
	applyMfaCookie,
	applySessionCookies,
	clearMfaCookie,
	clearSessionCookies,
	readCookie,
} from './session-cookies.js';

@ApiTags('auth')
@ApiExtraModels(ErrorEnvelopeRdo, TokenPairRdo, MfaChallengeRdo)
@Controller('auth')
export class AuthController {
	constructor(private readonly auth: AuthService) {}

	@Post('login')
	@Public()
	@HttpCode(200)
	@ApiOperation({
		summary: 'Mock IdP login',
		description:
			'Password-shaped stand-in for a mock identity provider. Not the production OAuth 2.0 authorization-code + PKCE flow. Practice selection is limited to server-side memberships. Browser clients receive HttpOnly session cookies; JSON token pairs remain for machine clients.',
	})
	@ApiBody({type: LoginRequestRdo})
	@ApiOkResponse({
		description: 'Opaque token pair, or a mock MFA challenge when the account requires it.',
		schema: {
			oneOf: [{$ref: getSchemaPath(TokenPairRdo)}, {$ref: getSchemaPath(MfaChallengeRdo)}],
		},
	})
	@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
	@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
	async login(
		@Body({schema: loginSchema}) body: LoginBody,
		@Res({passthrough: true}) response: Response,
	): Promise<TokenPairRdo | MfaChallengeRdo> {
		const result = await this.auth.login(body);
		const appEnv = resolveAppEnv();
		if (result.kind === 'mfa') {
			applyMfaCookie(response, result.mfaToken, appEnv);
			return {
				mfaRequired: true,
				mfaToken: result.mfaToken,
				expiresIn: result.expiresIn,
			};
		}
		applySessionCookies(response, result, appEnv);
		return {
			tokenType: result.tokenType,
			accessToken: result.accessToken,
			refreshToken: result.refreshToken,
			expiresIn: result.expiresIn,
		};
	}

	@Post('refresh')
	@Public()
	@HttpCode(200)
	@ApiOperation({
		summary: 'Rotate the mock refresh token',
		description:
			'Issues a new opaque access token and refresh token. Reuse of a rotated refresh token revokes that session. The refresh token may be sent in the JSON body or the HttpOnly mcp_refresh cookie.',
	})
	@ApiBody({type: RefreshRequestRdo})
	@ApiOkResponse({type: TokenPairRdo})
	@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
	async refresh(
		@Body({schema: refreshSchema}) body: RefreshBody,
		@Req() request: Request,
		@Res({passthrough: true}) response: Response,
	): Promise<TokenPairRdo> {
		const usedCookieAuth = !body.refreshToken;
		const refreshToken = body.refreshToken ?? readCookie(request, REFRESH_COOKIE_NAME);
		if (!refreshToken) {
			throw new SessionInvalidError();
		}
		assertCookieMutationCsrf({
			request,
			appEnv: resolveAppEnv(),
			usedCookieAuth,
		});
		const tokens = await this.auth.refresh(refreshToken);
		applySessionCookies(response, tokens, resolveAppEnv());
		return tokens;
	}

	@Post('mfa/verify')
	@Public()
	@HttpCode(200)
	@ApiOperation({
		summary: 'Verify a mock MFA challenge',
		description:
			'Completes mock login when the fixture account requires MFA. Not production TOTP. The MFA token may be sent in the JSON body or the HttpOnly mcp_mfa cookie.',
	})
	@ApiBody({type: MfaVerifyRequestRdo})
	@ApiOkResponse({type: TokenPairRdo})
	@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
	async verifyMfa(
		@Body({schema: mfaVerifySchema}) body: MfaVerifyBody,
		@Req() request: Request,
		@Res({passthrough: true}) response: Response,
	): Promise<TokenPairRdo> {
		const usedCookieAuth = !body.mfaToken;
		const mfaToken = body.mfaToken ?? readCookie(request, MFA_COOKIE_NAME);
		if (!mfaToken) {
			throw new SessionInvalidError();
		}
		assertCookieMutationCsrf({
			request,
			appEnv: resolveAppEnv(),
			usedCookieAuth,
		});
		const tokens = await this.auth.verifyMfa(mfaToken, body.code);
		const appEnv = resolveAppEnv();
		clearMfaCookie(response, appEnv);
		applySessionCookies(response, tokens, appEnv);
		return tokens;
	}

	@Get('session')
	@ApiSessionAuth()
	@ApiOperation({
		summary: 'Describe the current session',
		description:
			'Server-resolved user, role, and practice for the cookie or Bearer session. Contains no tokens or secrets.',
	})
	@ApiOkResponse({type: AuthSessionInfoRdo})
	@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
	async session(@Req() request: Request & RequestAuth): Promise<AuthSessionInfoRdo> {
		if (!request.authSessionId) {
			throw new SessionInvalidError();
		}
		return this.auth.describeSession(request.authSessionId);
	}

	@Post('logout')
	@HttpCode(204)
	@ApiSessionAuth()
	@ApiOperation({summary: 'Revoke the current mock session'})
	@ApiNoContentResponse({description: 'Current session revoked.'})
	@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
	async logout(
		@Req() request: Request & RequestAuth,
		@Res({passthrough: true}) response: Response,
	): Promise<void> {
		if (!request.authSessionId) {
			throw new SessionInvalidError();
		}
		await this.auth.logout(request.authSessionId);
		clearSessionCookies(response, resolveAppEnv());
	}

	@Post('logout-all')
	@HttpCode(204)
	@ApiSessionAuth()
	@ApiOperation({summary: 'Revoke every mock session for the authenticated user'})
	@ApiNoContentResponse({description: 'All sessions for the user revoked.'})
	@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
	async logoutAll(
		@Req() request: Request & RequestAuth,
		@Res({passthrough: true}) response: Response,
	): Promise<void> {
		if (!request.authUserId) {
			throw new SessionInvalidError();
		}
		await this.auth.logoutAll(request.authUserId);
		clearSessionCookies(response, resolveAppEnv());
	}
}
