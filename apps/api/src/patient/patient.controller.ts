import {
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	Patch,
	Post,
	Query,
} from '@nestjs/common';
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
	PatientCreateRequestRdo,
	PatientRdo,
	PatientSearchResultRdo,
	PatientUpdateRequestRdo,
} from './patient.rdo.js';
import {
	patientCreateSchema,
	patientIdParamsSchema,
	patientListQuerySchema,
	patientUpdateSchema,
	type PatientCreateBody,
	type PatientIdParams,
	type PatientListQuery,
	type PatientUpdateBody,
} from './patient.schema.js';
import {PatientService} from './patient.service.js';

@ApiTags('patients')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('patients')
export class PatientController {
	constructor(private readonly patients: PatientService) {}

	@Get()
	@ApiOperation({
		summary: 'List patients in the resolved practice',
		description:
			'Search, status filter, name sort, and page size of 10. Practice-wide readers see the tenant. Nurses see assigned patients. Patient users see their own record. Tenant comes from the session, not from the client.',
	})
	@ApiOkResponse({type: PatientSearchResultRdo})
	list(
		@Query({schema: patientListQuerySchema}) query: PatientListQuery,
	): Promise<PatientSearchResultRdo> {
		return this.patients.list(query);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Read one patient demographics record',
		description:
			'Unknown ids, cross-tenant ids, and records outside the caller’s assignment or portal scope return the same not-found response.',
	})
	@ApiOkResponse({type: PatientRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	get(@Param({schema: patientIdParamsSchema}) params: PatientIdParams): Promise<PatientRdo> {
		return this.patients.get(params.id);
	}

	@Post()
	@HttpCode(201)
	@ApiOperation({
		summary: 'Create a synthetic patient',
		description:
			'Requires write:demographics. The assigned provider must be a provider in the server-resolved practice. synthetic is always stored as true.',
	})
	@ApiBody({type: PatientCreateRequestRdo})
	@ApiCreatedResponse({type: PatientRdo})
	create(@Body({schema: patientCreateSchema}) body: PatientCreateBody): Promise<PatientRdo> {
		return this.patients.create(body);
	}

	@Patch(':id')
	@ApiOperation({
		summary: 'Update synthetic patient demographics',
		description: 'Requires write:demographics and a record the caller is allowed to read.',
	})
	@ApiOkResponse({type: PatientRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	@ApiBody({type: PatientUpdateRequestRdo})
	update(
		@Param({schema: patientIdParamsSchema}) params: PatientIdParams,
		@Body({schema: patientUpdateSchema}) body: PatientUpdateBody,
	): Promise<PatientRdo> {
		return this.patients.update(params.id, body);
	}
}
