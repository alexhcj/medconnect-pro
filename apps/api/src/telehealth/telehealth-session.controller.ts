import {Body, Controller, Get, HttpCode, Param, Post, Query} from '@nestjs/common';
import {
	ApiBadGatewayResponse,
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
import {ApiSessionAuth} from '../identity/auth.decorators.js';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {RateLimit} from '../rate-limit/rate-limit.decorator.js';
import {RATE_LIMIT_POLICIES} from '../rate-limit/rate-limit.policies.js';
import {
	TelehealthMediaTokenRdo,
	TelehealthSessionCreateRequestRdo,
	TelehealthSessionRdo,
} from './telehealth-session.rdo.js';
import {
	telehealthOpenSessionQuerySchema,
	telehealthSessionCreateSchema,
	telehealthSessionIdParamsSchema,
	type TelehealthOpenSessionQuery,
	type TelehealthSessionCreateBody,
	type TelehealthSessionIdParams,
} from './telehealth-session.schema.js';
import {TelehealthSessionService} from './telehealth-session.service.js';

@ApiTags('telehealth')
@ApiSessionAuth()
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('telehealth/sessions')
export class TelehealthSessionController {
	constructor(private readonly sessions: TelehealthSessionService) {}

	@Post()
	@HttpCode(201)
	@RateLimit(RATE_LIMIT_POLICIES.telehealthCreate)
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

	@Get()
	@ApiOperation({
		summary: 'Resolve the open telehealth session for one appointment',
		description:
			'Visit participants only: the appointment provider, the portal patient, or an assigned nurse. Returns the same session object as get when a non-ended session exists. Missing, ended-only, cross-tenant, and out-of-scope appointments use the same not-found response. This does not create a session and does not accept a client practice id. Tenant comes from the session.',
	})
	@ApiOkResponse({type: TelehealthSessionRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	findOpen(
		@Query({schema: telehealthOpenSessionQuerySchema}) query: TelehealthOpenSessionQuery,
	): Promise<TelehealthSessionRdo> {
		return this.sessions.findOpenByAppointment(query.appointmentId);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Read one telehealth session',
		description:
			'Unknown ids, cross-tenant ids, and records outside the caller’s assignment or portal scope return the same not-found response. Cancelled, completed, or past-grace appointments lazily mark the session ended.',
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
	@RateLimit(RATE_LIMIT_POLICIES.telehealthJoin)
	@ApiOperation({
		summary: 'Join a telehealth session',
		description:
			'Visit participants only: the appointment provider, the portal patient, or an assigned nurse. Receptionists may create and end sessions but cannot join. Join is allowed from 15 minutes before the appointment start through 15 minutes after it ends. Cancelled or completed appointments are not joinable. This does not mint a media token. Leave is a client/Daily action; there is no Nest leave route.',
	})
	@ApiOkResponse({type: TelehealthSessionRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	@ApiConflictResponse({type: ErrorEnvelopeRdo})
	join(
		@Param({schema: telehealthSessionIdParamsSchema}) params: TelehealthSessionIdParams,
	): Promise<TelehealthSessionRdo> {
		return this.sessions.join(params.id);
	}

	@Post(':id/media-token')
	@HttpCode(200)
	@RateLimit(RATE_LIMIT_POLICIES.mediaToken)
	@ApiOperation({
		summary: 'Mint a Daily meeting token for a telehealth session',
		description:
			'Visit participants only: the appointment provider, the portal patient, or an assigned nurse. Receptionists cannot mint. Requires Nest state in_session (join first). Uses the same join window and appointment eligibility as POST .../join. Lazy-creates a private Daily room on first mint and reuses it afterward. This is media transport, not the application session. Daily failure returns 502 MEDIA_UNAVAILABLE.',
	})
	@ApiOkResponse({type: TelehealthMediaTokenRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	@ApiConflictResponse({type: ErrorEnvelopeRdo})
	@ApiBadGatewayResponse({
		type: ErrorEnvelopeRdo,
		description: 'MEDIA_UNAVAILABLE: Daily room or token minting failed.',
	})
	mediaToken(
		@Param({schema: telehealthSessionIdParamsSchema}) params: TelehealthSessionIdParams,
	): Promise<TelehealthMediaTokenRdo> {
		return this.sessions.mintMediaToken(params.id);
	}

	@Post(':id/end')
	@HttpCode(200)
	@ApiOperation({
		summary: 'End a telehealth session',
		description:
			'Requires write:appointments. Closes the application visit for all participants. Idempotent when the session is already ended. Best-effort deletes the Daily room; Nest ended remains source of truth if Daily fails.',
	})
	@ApiOkResponse({type: TelehealthSessionRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	end(
		@Param({schema: telehealthSessionIdParamsSchema}) params: TelehealthSessionIdParams,
	): Promise<TelehealthSessionRdo> {
		return this.sessions.end(params.id);
	}
}
