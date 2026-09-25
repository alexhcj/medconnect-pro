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
import {VitalCreateRequestRdo, VitalListRdo, VitalRdo} from './clinical.rdo.js';
import {
	patientIdParamsSchema,
	vitalCreateSchema,
	type PatientIdParams,
	type VitalCreateBody,
} from './clinical.schema.js';
import {ClinicalService} from './clinical.service.js';

@ApiTags('ehr')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('patients/:id/vitals')
export class VitalsController {
	constructor(private readonly clinical: ClinicalService) {}

	@Get()
	@ApiOperation({
		summary: 'List vitals for a patient',
		description:
			'Flattened vital-signs panel (not one Observation per measure, not LOINC). Requires write:vitals, or a portal user reading their own record. Tenant comes from the session.',
	})
	@ApiOkResponse({type: VitalListRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	list(@Param({schema: patientIdParamsSchema}) params: PatientIdParams): Promise<VitalListRdo> {
		return this.clinical.listVitals(params.id);
	}

	@Post()
	@HttpCode(201)
	@ApiOperation({
		summary: 'Create a synthetic vitals recording',
		description:
			'Requires write:vitals. recordedById is the authenticated actor. synthetic is always stored as true. This is not a FHIR create.',
	})
	@ApiBody({type: VitalCreateRequestRdo})
	@ApiCreatedResponse({type: VitalRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	create(
		@Param({schema: patientIdParamsSchema}) params: PatientIdParams,
		@Body({schema: vitalCreateSchema}) body: VitalCreateBody,
	): Promise<VitalRdo> {
		return this.clinical.createVital(params.id, body);
	}
}
