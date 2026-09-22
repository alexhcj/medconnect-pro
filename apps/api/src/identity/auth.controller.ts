import {Body, Controller, HttpCode, Post, Req} from '@nestjs/common';
import {
	ApiBearerAuth,
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
import type {Request} from 'express';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {SessionInvalidError} from './auth.errors.js';
import {Public} from './auth.decorators.js';
import type {RequestAuth} from './auth.guard.js';
import {LoginRequestRdo, MfaChallengeRdo, MfaVerifyRequestRdo, RefreshRequestRdo, TokenPairRdo} from './auth.rdo.js';
import {loginSchema, mfaVerifySchema, refreshSchema, type LoginBody, type MfaVerifyBody, type RefreshBody} from './auth.schema.js';
import {AuthService} from './auth.service.js';

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
			'Password-shaped stand-in for a mock identity provider. Not the production OAuth 2.0 authorization-code + PKCE flow. Practice selection is limited to server-side memberships.',
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
	async login(@Body({schema: loginSchema}) body: LoginBody): Promise<TokenPairRdo | MfaChallengeRdo> {
		const result = await this.auth.login(body);
		if (result.kind === 'mfa') {
			return {
				mfaRequired: true,
				mfaToken: result.mfaToken,
				expiresIn: result.expiresIn,
			};
		}
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
			'Issues a new opaque access token and refresh token. Reuse of a rotated refresh token revokes that session.',
	})
	@ApiBody({type: RefreshRequestRdo})
	@ApiOkResponse({type: TokenPairRdo})
	@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
	async refresh(@Body({schema: refreshSchema}) body: RefreshBody): Promise<TokenPairRdo> {
		return this.auth.refresh(body.refreshToken);
	}

	@Post('mfa/verify')
	@Public()
	@HttpCode(200)
	@ApiOperation({
		summary: 'Verify a mock MFA challenge',
		description: 'Completes mock login when the fixture account requires MFA. Not production TOTP.',
	})
	@ApiBody({type: MfaVerifyRequestRdo})
	@ApiOkResponse({type: TokenPairRdo})
	@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
	async verifyMfa(@Body({schema: mfaVerifySchema}) body: MfaVerifyBody): Promise<TokenPairRdo> {
		return this.auth.verifyMfa(body.mfaToken, body.code);
	}

	@Post('logout')
	@HttpCode(204)
	@ApiBearerAuth('bearer')
	@ApiOperation({summary: 'Revoke the current mock session'})
	@ApiNoContentResponse({description: 'Current session revoked.'})
	@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
	async logout(@Req() request: Request & RequestAuth): Promise<void> {
		if (!request.authSessionId) {
			throw new SessionInvalidError();
		}
		await this.auth.logout(request.authSessionId);
	}

	@Post('logout-all')
	@HttpCode(204)
	@ApiBearerAuth('bearer')
	@ApiOperation({summary: 'Revoke every mock session for the authenticated user'})
	@ApiNoContentResponse({description: 'All sessions for the user revoked.'})
	@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
	async logoutAll(@Req() request: Request & RequestAuth): Promise<void> {
		if (!request.authUserId) {
			throw new SessionInvalidError();
		}
		await this.auth.logoutAll(request.authUserId);
	}
}
