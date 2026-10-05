import {ApiProperty, ApiSchema} from '@nestjs/swagger';
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
}

@ApiSchema({name: 'PracticeUserRoleUpdateRequest'})
export class PracticeUserRoleUpdateRequestRdo {
	@ApiProperty({enum: PRACTICE_ROLES, example: 'PROVIDER'})
	role!: PracticeRole;
}
