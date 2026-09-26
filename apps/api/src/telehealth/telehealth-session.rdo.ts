import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {APPOINTMENT_TYPES} from '../persistence/entities/appointment.entity.js';
import {TELEHEALTH_SESSION_STATES} from '../persistence/entities/telehealth-session.entity.js';

@ApiSchema({name: 'TelehealthSession'})
export class TelehealthSessionRdo {
	@ApiProperty({format: 'uuid'})
	id!: string;

	@ApiProperty({format: 'uuid'})
	appointmentId!: string;

	@ApiProperty({
		format: 'uuid',
		description: 'Server-resolved practice id. Clients must not send this field for authorization.',
	})
	practiceId!: string;

	@ApiProperty({format: 'uuid'})
	patientId!: string;

	@ApiProperty({format: 'uuid'})
	providerId!: string;

	@ApiProperty({example: 'Avery Quinn'})
	patientName!: string;

	@ApiProperty({example: 'jordan.ellis@synthetic.example'})
	providerName!: string;

	@ApiProperty({example: '2026-09-26T14:00:00.000Z', description: 'Linked appointment start (ISO-8601).'})
	start!: string;

	@ApiProperty({example: '2026-09-26T15:00:00.000Z', description: 'Linked appointment end (ISO-8601).'})
	end!: string;

	@ApiProperty({enum: APPOINTMENT_TYPES, example: 'telehealth'})
	type!: (typeof APPOINTMENT_TYPES)[number];

	@ApiProperty({enum: TELEHEALTH_SESSION_STATES, example: 'waiting'})
	state!: (typeof TELEHEALTH_SESSION_STATES)[number];

	@ApiProperty({example: '2026-09-26T13:45:00.000Z'})
	waitingStartedAt!: string;

	@ApiProperty({required: false, example: '2026-09-26T14:02:00.000Z'})
	joinedAt?: string;

	@ApiProperty({required: false, example: '2026-09-26T14:40:00.000Z'})
	endedAt?: string;

	@ApiProperty({
		example: true,
		description: 'Always true. This API stores synthetic demo data only.',
	})
	synthetic!: boolean;
}

@ApiSchema({name: 'TelehealthSessionCreateRequest'})
export class TelehealthSessionCreateRequestRdo {
	@ApiProperty({format: 'uuid'})
	appointmentId!: string;
}
