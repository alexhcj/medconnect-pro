import {ApiProperty, ApiSchema} from '@nestjs/swagger';

@ApiSchema({name: 'LoginRequest'})
export class LoginRequestRdo {
	@ApiProperty({format: 'email', example: 'practice.admin@example.test'})
	email!: string;

	@ApiProperty({
		minLength: 8,
		format: 'password',
		description: 'Mock IdP password. Do not put real credentials in this document.',
	})
	password!: string;

	@ApiProperty({
		format: 'uuid',
		required: false,
		description:
			'Optional selector among the caller’s server-side memberships. A practice id outside that set is rejected.',
	})
	practiceId?: string;
}

@ApiSchema({name: 'RefreshRequest'})
export class RefreshRequestRdo {
	@ApiProperty({
		description: 'Opaque refresh token from login or the previous refresh. Not a production OAuth refresh token.',
		example: 'opaque-refresh-token',
	})
	refreshToken!: string;
}

@ApiSchema({name: 'MfaVerifyRequest'})
export class MfaVerifyRequestRdo {
	@ApiProperty({example: 'opaque-mfa-token'})
	mfaToken!: string;

	@ApiProperty({
		description: 'Mock MFA code. Not a production TOTP secret.',
		example: 'mock-code',
	})
	code!: string;
}

@ApiSchema({name: 'TokenPair'})
export class TokenPairRdo {
	@ApiProperty({enum: ['Bearer'], example: 'Bearer'})
	tokenType!: 'Bearer';

	@ApiProperty({
		description: 'Opaque mock access token. Stand-in for a future OAuth access token.',
		example: 'opaque-access-token',
	})
	accessToken!: string;

	@ApiProperty({example: 'opaque-refresh-token'})
	refreshToken!: string;

	@ApiProperty({
		example: 900,
		description: 'Access token lifetime in seconds, capped by the absolute session limit.',
	})
	expiresIn!: number;
}

@ApiSchema({name: 'MfaChallenge'})
export class MfaChallengeRdo {
	@ApiProperty({enum: [true], example: true})
	mfaRequired!: true;

	@ApiProperty({example: 'opaque-mfa-token'})
	mfaToken!: string;

	@ApiProperty({example: 300, description: 'Seconds until the mock MFA challenge expires.'})
	expiresIn!: number;
}
