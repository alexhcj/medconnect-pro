import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {NOTIFICATION_TYPES} from '../persistence/entities/notification.entity.js';

@ApiSchema({name: 'Notification'})
export class NotificationRdo {
	@ApiProperty({format: 'uuid'})
	id!: string;

	@ApiProperty({
		format: 'uuid',
		description: 'Server-resolved practice id. Clients must not send this field for authorization.',
	})
	practiceId!: string;

	@ApiProperty({enum: ['in_app'], example: 'in_app'})
	channel!: 'in_app';

	@ApiProperty({enum: NOTIFICATION_TYPES, example: 'generic'})
	type!: (typeof NOTIFICATION_TYPES)[number];

	@ApiProperty({example: 'Appointment updated'})
	title!: string;

	@ApiProperty({example: 'Your visit time changed. Open the schedule for details.'})
	body!: string;

	@ApiProperty({enum: ['pending', 'delivered', 'failed'], example: 'delivered'})
	status!: 'pending' | 'delivered' | 'failed';

	@ApiProperty({nullable: true, example: null, type: String})
	readAt!: string | null;

	@ApiProperty({example: '2026-09-27T12:00:00.000Z'})
	createdAt!: string;

	@ApiProperty({
		example: true,
		description: 'Always true. This API stores synthetic demo data only.',
	})
	synthetic!: boolean;
}

@ApiSchema({name: 'NotificationList'})
export class NotificationListRdo {
	@ApiProperty({type: [NotificationRdo]})
	notifications!: NotificationRdo[];
}

@ApiSchema({name: 'NotificationPreference'})
export class NotificationPreferenceRdo {
	@ApiProperty({
		format: 'uuid',
		description: 'Server-resolved practice id. Clients must not send this field for authorization.',
	})
	practiceId!: string;

	@ApiProperty({format: 'uuid'})
	userId!: string;

	@ApiProperty({example: true})
	inAppEnabled!: boolean;

	@ApiProperty({example: true})
	emailEnabled!: boolean;

	@ApiProperty({example: true})
	smsEnabled!: boolean;

	@ApiProperty({
		example: true,
		description: 'Always true. This API stores synthetic demo data only.',
	})
	synthetic!: boolean;
}

@ApiSchema({name: 'NotificationPreferenceUpdateRequest'})
export class NotificationPreferenceUpdateRequestRdo {
	@ApiProperty({required: false, example: true})
	inAppEnabled?: boolean;

	@ApiProperty({required: false, example: false})
	emailEnabled?: boolean;

	@ApiProperty({required: false, example: false})
	smsEnabled?: boolean;
}
