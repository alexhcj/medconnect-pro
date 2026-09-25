import {ApiProperty, ApiSchema} from '@nestjs/swagger';

@ApiSchema({name: 'AuditEvent'})
export class AuditEventRdo {
	@ApiProperty({format: 'uuid'})
	id!: string;

	@ApiProperty({format: 'uuid'})
	practiceId!: string;

	@ApiProperty({format: 'uuid'})
	actorUserId!: string;

	@ApiProperty({example: 'patient.accessed'})
	action!: string;

	@ApiProperty({example: 'patient'})
	resourceType!: string;

	@ApiProperty({format: 'uuid', nullable: true, example: null})
	resourceId!: string | null;

	@ApiProperty({example: '11111111-1111-4111-8111-111111111111'})
	correlationId!: string;

	@ApiProperty({example: '2026-09-25T12:00:00.000Z'})
	createdAt!: string;
}

@ApiSchema({name: 'AuditEventSearchResult'})
export class AuditEventSearchResultRdo {
	@ApiProperty({type: [AuditEventRdo]})
	events!: AuditEventRdo[];

	@ApiProperty({required: false, example: 2})
	nextPage?: number;

	@ApiProperty({example: false})
	hasMore!: boolean;
}
