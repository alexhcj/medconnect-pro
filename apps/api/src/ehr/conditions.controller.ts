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
import {
	ClinicalConditionRdo,
	ConditionCreateRequestRdo,
	ConditionListRdo,
} from './clinical.rdo.js';
import {
	conditionCreateSchema,
	patientIdParamsSchema,
	type ConditionCreateBody,
	type PatientIdParams,
} from './clinical.schema.js';
import {ClinicalService} from './clinical.service.js';

@ApiTags('ehr')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('patients/:id/conditions')
export class ConditionsController {
	constructor(private readonly clinical: ClinicalService) {}

	@Get()
	@ApiOperation({
		summary: 'List conditions for a patient',
		description:
			'Diagnoses as bounded Condition.code.text plus clinicalStatus. Not ICD/SNOMED and not a FHIR Condition resource. Requires write:medical_records, or a portal user reading their own record. Tenant comes from the session.',
	})
	@ApiOkResponse({type: ConditionListRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	list(@Param({schema: patientIdParamsSchema}) params: PatientIdParams): Promise<ConditionListRdo> {
		return this.clinical.listConditions(params.id);
	}

	@Post()
	@HttpCode(201)
	@ApiOperation({
		summary: 'Create a synthetic condition',
		description:
			'Requires write:medical_records. recordedById is the authenticated actor. synthetic is always stored as true. This is not a FHIR create.',
	})
	@ApiBody({type: ConditionCreateRequestRdo})
	@ApiCreatedResponse({type: ClinicalConditionRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	create(
		@Param({schema: patientIdParamsSchema}) params: PatientIdParams,
		@Body({schema: conditionCreateSchema}) body: ConditionCreateBody,
	): Promise<ClinicalConditionRdo> {
		return this.clinical.createCondition(params.id, body);
	}
}
