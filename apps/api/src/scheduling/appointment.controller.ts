import {
	Body,
	Controller,
	Delete,
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
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {
	AppointmentCreateRequestRdo,
	AppointmentRdo,
	AppointmentSearchResultRdo,
	AppointmentUpdateRequestRdo,
} from './appointment.rdo.js';
import {
	appointmentCreateSchema,
	appointmentIdParamsSchema,
	appointmentListQuerySchema,
	appointmentUpdateSchema,
	type AppointmentCreateBody,
	type AppointmentIdParams,
	type AppointmentListQuery,
	type AppointmentUpdateBody,
} from './appointment.schema.js';
import {AppointmentService} from './appointment.service.js';

@ApiTags('appointments')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('appointments')
export class AppointmentController {
	constructor(private readonly appointments: AppointmentService) {}

	@Get()
	@ApiOperation({
		summary: 'List appointments in the resolved practice',
		description:
			'Optional from/to window, patient, provider, and state filters. Page size defaults to 50 (max 100). Tenant comes from the session, not from the client. Nurses see assigned patients. Patient users see their own appointments.',
	})
	@ApiOkResponse({type: AppointmentSearchResultRdo})
	list(
		@Query({schema: appointmentListQuerySchema}) query: AppointmentListQuery,
	): Promise<AppointmentSearchResultRdo> {
		return this.appointments.list(query);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Read one appointment',
		description:
			'Unknown ids, cross-tenant ids, and records outside the caller’s assignment or portal scope return the same not-found response.',
	})
	@ApiOkResponse({type: AppointmentRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	get(@Param({schema: appointmentIdParamsSchema}) params: AppointmentIdParams): Promise<AppointmentRdo> {
		return this.appointments.get(params.id);
	}

	@Post()
	@HttpCode(201)
	@ApiOperation({
		summary: 'Create a synthetic appointment',
		description:
			'Requires write:appointments. Patient and provider must belong to the server-resolved practice. Overlapping non-cancelled provider times are rejected. synthetic is always stored as true.',
	})
	@ApiBody({type: AppointmentCreateRequestRdo})
	@ApiCreatedResponse({type: AppointmentRdo})
	@ApiConflictResponse({type: ErrorEnvelopeRdo})
	create(@Body({schema: appointmentCreateSchema}) body: AppointmentCreateBody): Promise<AppointmentRdo> {
		return this.appointments.create(body);
	}

	@Patch(':id')
	@ApiOperation({
		summary: 'Update a synthetic appointment',
		description:
			'Requires write:appointments and a record the caller is allowed to read. Rescheduling re-checks provider overlap. Cancelled appointments do not occupy the slot.',
	})
	@ApiOkResponse({type: AppointmentRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	@ApiConflictResponse({type: ErrorEnvelopeRdo})
	@ApiBody({type: AppointmentUpdateRequestRdo})
	update(
		@Param({schema: appointmentIdParamsSchema}) params: AppointmentIdParams,
		@Body({schema: appointmentUpdateSchema}) body: AppointmentUpdateBody,
	): Promise<AppointmentRdo> {
		return this.appointments.update(params.id, body);
	}

	@Delete(':id')
	@HttpCode(204)
	@ApiOperation({
		summary: 'Delete an appointment',
		description: 'Requires write:appointments. Cancel without removing the row by PATCHing state to cancelled.',
	})
	@ApiNoContentResponse()
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	remove(@Param({schema: appointmentIdParamsSchema}) params: AppointmentIdParams): Promise<void> {
		return this.appointments.remove(params.id);
	}
}
