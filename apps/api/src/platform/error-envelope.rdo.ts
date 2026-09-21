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
