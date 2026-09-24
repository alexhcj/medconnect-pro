import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {
	APPOINTMENT_CREATE_STATES,
	APPOINTMENT_STATES,
	APPOINTMENT_TYPES,
} from '../persistence/entities/appointment.entity.js';

@ApiSchema({name: 'Appointment'})
export class AppointmentRdo {
	@ApiProperty({format: 'uuid'})
	id!: string;

	@ApiProperty({
		format: 'uuid',
		description: 'Server-resolved practice id. Clients must not send this field for authorization.',
	})
	practiceId!: string;

	@ApiProperty({format: 'uuid'})
	patientId!: string;

	@ApiProperty({format: 'uuid'})
	providerId!: string;

	@ApiProperty({example: '2026-10-15T14:00:00.000Z', description: 'Start instant (ISO-8601).'})
	start!: string;

	@ApiProperty({example: '2026-10-15T15:00:00.000Z', description: 'End instant (ISO-8601).'})
	end!: string;

	@ApiProperty({enum: APPOINTMENT_TYPES, example: 'office_visit'})
	type!: (typeof APPOINTMENT_TYPES)[number];

	@ApiProperty({enum: APPOINTMENT_STATES, example: 'scheduled'})
	state!: (typeof APPOINTMENT_STATES)[number];

	@ApiProperty({required: false, example: 'Annual follow-up'})
	notes?: string;

	@ApiProperty({example: 'Avery Quinn'})
	patientName!: string;

	@ApiProperty({example: 'jordan.ellis@synthetic.example'})
	providerName!: string;

	@ApiProperty({
		example: true,
		description: 'Always true. This API stores synthetic demo data only.',
	})
	synthetic!: boolean;
}

@ApiSchema({name: 'AppointmentSearchResult'})
export class AppointmentSearchResultRdo {
	@ApiProperty({type: [AppointmentRdo]})
	appointments!: AppointmentRdo[];

	@ApiProperty({required: false, example: 2})
	nextPage?: number;

	@ApiProperty({example: false})
	hasMore!: boolean;
}

@ApiSchema({name: 'AppointmentCreateRequest'})
export class AppointmentCreateRequestRdo {
	@ApiProperty({format: 'uuid'})
	patientId!: string;

	@ApiProperty({format: 'uuid'})
	providerId!: string;

	@ApiProperty({example: '2026-10-15T14:00:00.000Z'})
	start!: string;

	@ApiProperty({example: '2026-10-15T15:00:00.000Z'})
	end!: string;

	@ApiProperty({enum: APPOINTMENT_TYPES, example: 'office_visit'})
	type!: (typeof APPOINTMENT_TYPES)[number];

	@ApiProperty({enum: APPOINTMENT_CREATE_STATES, example: 'scheduled'})
	state!: (typeof APPOINTMENT_CREATE_STATES)[number];

	@ApiProperty({required: false, example: 'Annual follow-up'})
	notes?: string;
}

@ApiSchema({name: 'AppointmentUpdateRequest'})
export class AppointmentUpdateRequestRdo {
	@ApiProperty({required: false, format: 'uuid'})
	patientId?: string;

	@ApiProperty({required: false, format: 'uuid'})
	providerId?: string;

	@ApiProperty({required: false, example: '2026-10-15T14:00:00.000Z'})
	start?: string;

	@ApiProperty({required: false, example: '2026-10-15T15:00:00.000Z'})
	end?: string;

	@ApiProperty({required: false, enum: APPOINTMENT_TYPES})
	type?: (typeof APPOINTMENT_TYPES)[number];

	@ApiProperty({required: false, enum: APPOINTMENT_STATES})
	state?: (typeof APPOINTMENT_STATES)[number];

	@ApiProperty({required: false, example: 'Annual follow-up'})
	notes?: string;
}

@ApiSchema({name: 'AvailabilityWorkingHours'})
export class AvailabilityWorkingHoursRdo {
	@ApiProperty({example: 1, description: 'ISO weekday where 1 is Monday and 5 is Friday.'})
	weekday!: number;

	@ApiProperty({example: '09:00'})
	startLocal!: string;

	@ApiProperty({example: '17:00'})
	endLocal!: string;

	@ApiProperty({example: 'UTC'})
	timeZone!: string;
}

@ApiSchema({name: 'AvailabilityBusyInterval'})
export class AvailabilityBusyIntervalRdo {
	@ApiProperty({format: 'uuid'})
	appointmentId!: string;

	@ApiProperty({example: '2026-10-15T14:00:00.000Z'})
	start!: string;

	@ApiProperty({example: '2026-10-15T15:00:00.000Z'})
	end!: string;
}

@ApiSchema({name: 'AvailabilityFreeInterval'})
export class AvailabilityFreeIntervalRdo {
	@ApiProperty({example: '2026-10-15T09:00:00.000Z'})
	start!: string;

	@ApiProperty({example: '2026-10-15T14:00:00.000Z'})
	end!: string;
}

@ApiSchema({name: 'ProviderAvailability'})
export class ProviderAvailabilityRdo {
	@ApiProperty({format: 'uuid'})
	providerId!: string;

	@ApiProperty({format: 'uuid'})
	practiceId!: string;

	@ApiProperty({example: '2026-10-15T00:00:00.000Z'})
	from!: string;

	@ApiProperty({example: '2026-10-16T00:00:00.000Z'})
	to!: string;

	@ApiProperty({example: 'UTC'})
	timeZone!: string;

	@ApiProperty({type: [AvailabilityWorkingHoursRdo]})
	workingHours!: AvailabilityWorkingHoursRdo[];

	@ApiProperty({type: [AvailabilityBusyIntervalRdo]})
	busy!: AvailabilityBusyIntervalRdo[];

	@ApiProperty({type: [AvailabilityFreeIntervalRdo]})
	free!: AvailabilityFreeIntervalRdo[];
}
