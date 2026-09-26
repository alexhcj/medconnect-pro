import {Body, Controller, Get, HttpCode, Param, Post} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiConflictResponse,
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
	TelehealthSessionCreateRequestRdo,
	TelehealthSessionRdo,
} from './telehealth-session.rdo.js';
import {
	telehealthSessionCreateSchema,
	telehealthSessionIdParamsSchema,
	type TelehealthSessionCreateBody,
	type TelehealthSessionIdParams,
} from './telehealth-session.schema.js';
import {TelehealthSessionService} from './telehealth-session.service.js';

@ApiTags('telehealth')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('telehealth/sessions')
export class TelehealthSessionController {
	constructor(private readonly sessions: TelehealthSessionService) {}

	@Post()
	@HttpCode(201)
	@ApiOperation({
		summary: 'Create an appointment-linked telehealth session',
		description:
			'Requires write:appointments. The appointment must be a scheduled or confirmed telehealth visit that has not passed the 15-minute post-end grace window. Tenant comes from the session, not from the client. synthetic is always stored as true. Returns the existing non-ended session when one already exists. This is an application session, not a media room.',
	})
	@ApiBody({type: TelehealthSessionCreateRequestRdo})
	@ApiCreatedResponse({type: TelehealthSessionRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	@ApiConflictResponse({type: ErrorEnvelopeRdo})
	create(
		@Body({schema: telehealthSessionCreateSchema}) body: TelehealthSessionCreateBody,
	): Promise<TelehealthSessionRdo> {
		return this.sessions.create(body);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Read one telehealth session',
		description:
			'Unknown ids, cross-tenant ids, and records outside the caller’s assignment or portal scope return the same not-found response. Past the appointment end plus 15 minutes, the session is lazily marked ended.',
	})
	@ApiOkResponse({type: TelehealthSessionRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	get(
		@Param({schema: telehealthSessionIdParamsSchema}) params: TelehealthSessionIdParams,
	): Promise<TelehealthSessionRdo> {
		return this.sessions.get(params.id);
	}

	@Post(':id/join')
	@HttpCode(200)
	@ApiOperation({
		summary: 'Join a telehealth session',
		description:
			'Visit participants only: the appointment provider, the portal patient, or an assigned nurse. Receptionists may create and end sessions but cannot join. Join is allowed from 15 minutes before the appointment start through 15 minutes after it ends. This does not mint a media token.',
	})
	@ApiOkResponse({type: TelehealthSessionRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	@ApiConflictResponse({type: ErrorEnvelopeRdo})
	join(
		@Param({schema: telehealthSessionIdParamsSchema}) params: TelehealthSessionIdParams,
	): Promise<TelehealthSessionRdo> {
		return this.sessions.join(params.id);
	}

	@Post(':id/end')
	@HttpCode(200)
	@ApiOperation({
		summary: 'End a telehealth session',
		description:
			'Requires write:appointments. Closes the application visit for all participants. Idempotent when the session is already ended.',
	})
	@ApiOkResponse({type: TelehealthSessionRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	end(
		@Param({schema: telehealthSessionIdParamsSchema}) params: TelehealthSessionIdParams,
	): Promise<TelehealthSessionRdo> {
		return this.sessions.end(params.id);
	}
}
