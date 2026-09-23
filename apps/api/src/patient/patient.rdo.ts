import {ApiProperty, ApiSchema} from '@nestjs/swagger';

@ApiSchema({name: 'PatientAddress'})
export class PatientAddressRdo {
	@ApiProperty({example: '100 Demo Street'})
	street!: string;

	@ApiProperty({example: 'Harborview'})
	city!: string;

	@ApiProperty({example: 'WA'})
	state!: string;

	@ApiProperty({example: '98101'})
	postalCode!: string;
}

@ApiSchema({name: 'EmergencyContact'})
export class EmergencyContactRdo {
	@ApiProperty({example: 'Sky Quinn'})
	name!: string;

	@ApiProperty({example: 'Sibling'})
	relationship!: string;

	@ApiProperty({example: '555-0101'})
	phone!: string;
}

@ApiSchema({name: 'PatientInsurance'})
export class PatientInsuranceRdo {
	@ApiProperty({example: 'Synthetic Health Plan'})
	provider!: string;

	@ApiProperty({example: 'SYN-100'})
	policyNumber!: string;

	@ApiProperty({example: 'GRP-1'})
	groupNumber!: string;
}

@ApiSchema({name: 'Patient'})
export class PatientRdo {
	@ApiProperty({format: 'uuid'})
	id!: string;

	@ApiProperty({example: 'Avery'})
	firstName!: string;

	@ApiProperty({example: 'Quinn'})
	lastName!: string;

	@ApiProperty({example: '1988-04-12', description: 'ISO date (YYYY-MM-DD).'})
	dateOfBirth!: string;

	@ApiProperty({enum: ['female', 'male', 'non-binary'], example: 'female'})
	gender!: 'female' | 'male' | 'non-binary';

	@ApiProperty({enum: ['active', 'inactive'], example: 'active'})
	status!: 'active' | 'inactive';

	@ApiProperty({example: '555-0100'})
	phone!: string;

	@ApiProperty({format: 'email', example: 'avery.quinn@synthetic.example'})
	email!: string;

	@ApiProperty({type: PatientAddressRdo})
	address!: PatientAddressRdo;

	@ApiProperty({type: EmergencyContactRdo})
	emergencyContact!: EmergencyContactRdo;

	@ApiProperty({type: PatientInsuranceRdo})
	insurance!: PatientInsuranceRdo;

	@ApiProperty({
		format: 'uuid',
		description: 'User id of the assigned provider in this practice.',
	})
	providerId!: string;

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

@ApiSchema({name: 'PatientSearchResult'})
export class PatientSearchResultRdo {
	@ApiProperty({type: [PatientRdo]})
	patients!: PatientRdo[];

	@ApiProperty({required: false, example: 2})
	nextPage?: number;

	@ApiProperty({example: false})
	hasMore!: boolean;
}

@ApiSchema({name: 'PatientCreateRequest'})
export class PatientCreateRequestRdo {
	@ApiProperty({example: 'Avery'})
	firstName!: string;

	@ApiProperty({example: 'Quinn'})
	lastName!: string;

	@ApiProperty({example: '1988-04-12'})
	dateOfBirth!: string;

	@ApiProperty({enum: ['female', 'male', 'non-binary'], example: 'female'})
	gender!: 'female' | 'male' | 'non-binary';

	@ApiProperty({enum: ['active', 'inactive'], example: 'active'})
	status!: 'active' | 'inactive';

	@ApiProperty({example: '555-0100'})
	phone!: string;

	@ApiProperty({format: 'email', example: 'avery.quinn@synthetic.example'})
	email!: string;

	@ApiProperty({type: PatientAddressRdo})
	address!: PatientAddressRdo;

	@ApiProperty({type: EmergencyContactRdo})
	emergencyContact!: EmergencyContactRdo;

	@ApiProperty({type: PatientInsuranceRdo})
	insurance!: PatientInsuranceRdo;

	@ApiProperty({format: 'uuid'})
	providerId!: string;
}

@ApiSchema({name: 'PatientUpdateRequest'})
export class PatientUpdateRequestRdo {
	@ApiProperty({required: false, example: 'Avery'})
	firstName?: string;

	@ApiProperty({required: false, example: 'Quinn'})
	lastName?: string;

	@ApiProperty({required: false, example: '1988-04-12'})
	dateOfBirth?: string;

	@ApiProperty({required: false, enum: ['female', 'male', 'non-binary']})
	gender?: 'female' | 'male' | 'non-binary';

	@ApiProperty({required: false, enum: ['active', 'inactive']})
	status?: 'active' | 'inactive';

	@ApiProperty({required: false, example: '555-0102'})
	phone?: string;

	@ApiProperty({required: false, format: 'email'})
	email?: string;

	@ApiProperty({required: false, type: PatientAddressRdo})
	address?: PatientAddressRdo;

	@ApiProperty({required: false, type: EmergencyContactRdo})
	emergencyContact?: EmergencyContactRdo;

	@ApiProperty({required: false, type: PatientInsuranceRdo})
	insurance?: PatientInsuranceRdo;

	@ApiProperty({required: false, format: 'uuid'})
	providerId?: string;
}
