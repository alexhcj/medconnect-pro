import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {DEMO_PERSONA_KEYS, type DemoPersonaKey} from '../tenancy/persona-key.js';
import {PRACTICE_ROLES, type PracticeRole} from '../tenancy/practice-role.js';

@ApiSchema({name: 'PracticeUser'})
export class PracticeUserRdo {
	@ApiProperty({format: 'uuid', description: 'User id, not the membership id.'})
	id!: string;

	@ApiProperty({format: 'email', example: 'practice.admin@example.test'})
	email!: string;

	@ApiProperty({enum: PRACTICE_ROLES, example: 'PRACTICE_ADMIN'})
	role!: PracticeRole;

	@ApiProperty({
		example: 'Dr. Jordan Ellis',
		description:
			'Membership display name; the patient record name for PATIENT; otherwise a role label. Never the email.',
	})
	displayName!: string;

	@ApiProperty({
		type: String,
		nullable: true,
		example: 'MD',
		description: 'Optional credential shown beside the name (for example MD, RN).',
	})
	credential!: string | null;

	@ApiProperty({
		enum: DEMO_PERSONA_KEYS,
		nullable: true,
		example: 'provider-jordan-ellis',
		description: 'Optional demo persona key (synthetic camera; read-only in M22).',
	})
	personaKey!: DemoPersonaKey | null;

	@ApiProperty({
		format: 'uuid',
		description: 'Server-resolved practice id. Clients must not send this field for authorization.',
	})
	practiceId!: string;

	@ApiProperty({
		example: true,
		description: 'Always true. This API stores synthetic demo data only.',
	})
	synthetic!: boolean;
}

@ApiSchema({name: 'PracticeUserList'})
export class PracticeUserListRdo {
	@ApiProperty({type: [PracticeUserRdo]})
	users!: PracticeUserRdo[];

	@ApiProperty({example: 42, description: 'Session-practice memberships matching the filters.'})
	total!: number;

	@ApiProperty({example: true})
	hasMore!: boolean;

	@ApiProperty({required: false, example: 2})
	nextPage?: number;
}

@ApiSchema({name: 'PracticeUserRoleUpdateRequest'})
export class PracticeUserRoleUpdateRequestRdo {
	@ApiProperty({enum: PRACTICE_ROLES, example: 'PROVIDER'})
	role!: PracticeRole;
}
