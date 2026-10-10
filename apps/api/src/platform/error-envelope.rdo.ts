import {ApiProperty, ApiSchema} from '@nestjs/swagger';

@ApiSchema({name: 'ErrorDetail'})
export class ErrorDetailRdo {
	@ApiProperty({example: 'name'})
	path!: string;

	@ApiProperty({example: 'Required'})
	message!: string;
}

@ApiSchema({name: 'ErrorBody'})
export class ErrorBodyRdo {
	@ApiProperty({example: 'VALIDATION_ERROR'})
	code!: string;

	@ApiProperty({example: 'Request validation failed'})
	message!: string;

	@ApiProperty({
		type: [ErrorDetailRdo],
		required: false,
		example: [{path: 'name', message: 'Required'}],
	})
	details?: ErrorDetailRdo[];
}

@ApiSchema({name: 'RateLimitedDetails'})
export class RateLimitedDetailsRdo {
	@ApiProperty({example: 120, minimum: 1, description: 'Seconds until the window resets'})
	retryAfterSeconds!: number;
}

@ApiSchema({name: 'RateLimitedErrorBody'})
export class RateLimitedErrorBodyRdo {
	@ApiProperty({example: 'RATE_LIMITED', enum: ['RATE_LIMITED']})
	code!: string;

	@ApiProperty({example: 'Too many requests. Try again later.'})
	message!: string;

	@ApiProperty({type: RateLimitedDetailsRdo})
	details!: RateLimitedDetailsRdo;
}

@ApiSchema({name: 'RateLimitedErrorEnvelope'})
export class RateLimitedErrorEnvelopeRdo {
	@ApiProperty({type: RateLimitedErrorBodyRdo})
	error!: RateLimitedErrorBodyRdo;

	@ApiProperty({format: 'uuid', example: '00000000-0000-4000-8000-000000000001'})
	correlationId!: string;
}

@ApiSchema({name: 'ErrorEnvelope'})
export class ErrorEnvelopeRdo {
	@ApiProperty({type: ErrorBodyRdo})
	error!: ErrorBodyRdo;

	@ApiProperty({
		format: 'uuid',
		example: '00000000-0000-4000-8000-000000000001',
	})
	correlationId!: string;
}
