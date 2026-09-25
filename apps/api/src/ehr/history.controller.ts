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
import {HistoryCreateRequestRdo, HistoryEntryRdo, HistoryListRdo} from './clinical.rdo.js';
import {
	historyCreateSchema,
	patientIdParamsSchema,
	type HistoryCreateBody,
	type PatientIdParams,
} from './clinical.schema.js';
import {ClinicalService} from './clinical.service.js';

@ApiTags('ehr')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('patients/:id/history')
export class HistoryController {
	constructor(private readonly clinical: ClinicalService) {}

	@Get()
	@ApiOperation({
		summary: 'List history entries for a patient',
		description:
			'Visit, consultation, and procedure events in the longitudinal record. Conceptual FHIR ClinicalImpression/DocumentReference alignment only — not a FHIR resource payload. Requires write:medical_records, or a portal user reading their own record. History is not a bucket for conditions, vitals, or medications. Tenant comes from the session.',
	})
	@ApiOkResponse({type: HistoryListRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	list(@Param({schema: patientIdParamsSchema}) params: PatientIdParams): Promise<HistoryListRdo> {
		return this.clinical.listHistory(params.id);
	}

	@Post()
	@HttpCode(201)
	@ApiOperation({
		summary: 'Create a synthetic history entry',
		description:
			'Requires write:medical_records. providerId is the authenticated actor. synthetic is always stored as true. This is not a FHIR create.',
	})
	@ApiBody({type: HistoryCreateRequestRdo})
	@ApiCreatedResponse({type: HistoryEntryRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	create(
		@Param({schema: patientIdParamsSchema}) params: PatientIdParams,
		@Body({schema: historyCreateSchema}) body: HistoryCreateBody,
	): Promise<HistoryEntryRdo> {
		return this.clinical.createHistory(params.id, body);
	}
}
