import {ApiProperty, ApiSchema} from '@nestjs/swagger';

@ApiSchema({name: 'HealthStatus'})
export class HealthRdo {
	@ApiProperty({enum: ['ok'], example: 'ok'})
	status!: 'ok';
}

@ApiSchema({name: 'ReadyStatus'})
export class ReadyRdo {
	@ApiProperty({enum: ['ready'], example: 'ready'})
	status!: 'ready';
}
