import {Body, Controller, Get, HttpCode, Param, Post} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {MedicationCreateRequestRdo, MedicationListRdo, MedicationRdo} from './clinical.rdo.js';
import {
	medicationCreateSchema,
	patientIdParamsSchema,
	type MedicationCreateBody,
	type PatientIdParams,
} from './clinical.schema.js';
import {ClinicalService} from './clinical.service.js';

@ApiTags('ehr')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('patients/:id/medications')
export class MedicationsController {
	constructor(private readonly clinical: ClinicalService) {}

	@Get()
	@ApiOperation({
		summary: 'List medications for a patient',
		description:
			'MedicationRequest-like orders (not RxNorm, not MedicationStatement). Requires write:medical_records, or a portal user reading their own record. Tenant comes from the session.',
	})
	@ApiOkResponse({type: MedicationListRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	list(@Param({schema: patientIdParamsSchema}) params: PatientIdParams): Promise<MedicationListRdo> {
		return this.clinical.listMedications(params.id);
	}

	@Post()
	@HttpCode(201)
	@ApiOperation({
		summary: 'Create a synthetic medication',
		description:
			'Requires write:medical_records. prescriberId is the authenticated actor. synthetic is always stored as true. This is not a FHIR create.',
	})
	@ApiBody({type: MedicationCreateRequestRdo})
	@ApiCreatedResponse({type: MedicationRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	create(
		@Param({schema: patientIdParamsSchema}) params: PatientIdParams,
		@Body({schema: medicationCreateSchema}) body: MedicationCreateBody,
	): Promise<MedicationRdo> {
		return this.clinical.createMedication(params.id, body);
	}
}
