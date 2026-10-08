import {Inject, Injectable, Logger} from '@nestjs/common';
import {REQUEST} from '@nestjs/core';
import type {Request} from 'express';
import {AuditEventRepository} from '../audit/audit-event.repository.js';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import type {Appointment} from '../persistence/entities/appointment.entity.js';
import type {TelehealthSession} from '../persistence/entities/telehealth-session.entity.js';
import {getCorrelationId} from '../platform/correlation.js';
import {PatientRepository} from '../practice/patient.repository.js';
import {AppointmentRepository} from '../scheduling/appointment.repository.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {DAILY_MEDIA_PORT, type DailyMediaPort} from './daily-media-port.js';
import {
	canCreateOrEndTelehealthSession,
	isVisitJoinParticipant,
	resolveTelehealthReadScope,
} from './telehealth-access.js';
import {
	InvalidTelehealthAppointmentError,
	SessionAlreadyEndedError,
	SessionNotJoinableError,
	TelehealthSessionNotFoundError,
} from './telehealth-session.errors.js';
import type {TelehealthMediaTokenRdo, TelehealthSessionRdo} from './telehealth-session.rdo.js';
import type {TelehealthSessionCreateBody} from './telehealth-session.schema.js';
import {
	TelehealthSessionRepository,
	TelehealthSessionUniqueConstraintError,
} from './telehealth-session.repository.js';
import {
	canCreateTelehealthSession,
	isPastGraceExpiry,
	isWithinJoinWindow,
	TELEHEALTH_GRACE_MS,
} from './telehealth-window.js';

const AUDIT_RESOURCE = 'telehealth_session';

@Injectable()
export class TelehealthSessionService {
	private readonly logger = new Logger(TelehealthSessionService.name);

	constructor(
		private readonly sessions: TelehealthSessionRepository,
		private readonly appointments: AppointmentRepository,
		private readonly patients: PatientRepository,
		private readonly audit: AuditEventRepository,
		@Inject(DAILY_MEDIA_PORT) private readonly daily: DailyMediaPort,
		private readonly tenant: TenantContext,
		@Inject(REQUEST) private readonly request: Request,
	) {}

	async create(input: TelehealthSessionCreateBody): Promise<TelehealthSessionRdo> {
		this.assertCanWrite();
		const appointment = await this.loadAppointmentForCreate(input.appointmentId);
		const existing = await this.sessions.getByAppointmentId(appointment.id);
		if (existing) {
			const current = await this.applyGraceExpiry(existing, appointment);
			if (current.state === 'ended') {
				throw new SessionAlreadyEndedError();
			}
			return toSessionRdo(current, appointment);
		}

		const now = new Date();
		try {
			const row = await this.sessions.create({
				appointmentId: appointment.id,
				state: 'waiting',
				waitingStartedAt: now,
			});
			await this.recordAudit('telehealth_session.created', row.id);
			return toSessionRdo(row, appointment);
		} catch (error) {
			if (error instanceof TelehealthSessionUniqueConstraintError) {
				const raced = await this.sessions.getByAppointmentId(appointment.id);
				if (!raced) {
					throw new TelehealthSessionNotFoundError();
				}
				const current = await this.applyGraceExpiry(raced, appointment);
				if (current.state === 'ended') {
					throw new SessionAlreadyEndedError();
				}
				return toSessionRdo(current, appointment);
			}
			throw error;
		}
	}

	async get(id: string): Promise<TelehealthSessionRdo> {
		const {session, appointment} = await this.loadVisible(id);
		return toSessionRdo(session, appointment);
	}

	async join(id: string): Promise<TelehealthSessionRdo> {
		const {session, appointment} = await this.loadVisible(id);
		await this.assertCanJoin(appointment);
		if (session.state === 'ended') {
			throw new SessionNotJoinableError();
		}
		if (!isWithinJoinWindow(appointment.startAt, appointment.endAt)) {
			throw new SessionNotJoinableError();
		}
		if (session.state === 'in_session') {
			return toSessionRdo(session, appointment);
		}

		session.state = 'in_session';
		session.joinedAt = new Date();
		const saved = await this.sessions.save(session);
		await this.recordAudit('telehealth_session.joined', saved.id);
		return toSessionRdo(saved, appointment);
	}

	async mintMediaToken(id: string): Promise<TelehealthMediaTokenRdo> {
		const {session, appointment} = await this.loadVisible(id);
		await this.assertCanJoin(appointment);
		if (session.state === 'ended') {
			throw new SessionNotJoinableError();
		}
		if (!isWithinJoinWindow(appointment.startAt, appointment.endAt)) {
			throw new SessionNotJoinableError();
		}

		const expiresAtUnix = joinWindowExpiresAtUnix(appointment.endAt);
		const room = await this.daily.createOrGetRoom({
			sessionId: session.id,
			expiresAtUnix,
		});
		if (session.dailyRoomName !== room.roomName) {
			session.dailyRoomName = room.roomName;
			await this.sessions.save(session);
		}

		const scope = this.tenant.require();
		const minted = await this.daily.mintMeetingToken({
			roomName: room.roomName,
			userId: scope.actorUserId,
			expiresAtUnix,
		});
		await this.recordAudit('telehealth_session.media_token_minted', session.id);
		return {roomUrl: room.roomUrl, token: minted.token};
	}

	async end(id: string): Promise<TelehealthSessionRdo> {
		this.assertCanWrite();
		const {session, appointment} = await this.loadVisible(id);
		if (session.state === 'ended') {
			return toSessionRdo(session, appointment);
		}
		const saved = await this.markEnded(session);
		return toSessionRdo(saved, appointment);
	}

	private assertCanWrite(): void {
		const {role} = this.tenant.require();
		if (!canCreateOrEndTelehealthSession(role)) {
			throw new PermissionDeniedError();
		}
	}

	private async loadAppointmentForCreate(appointmentId: string): Promise<Appointment> {
		const appointment = await this.appointments.getById(appointmentId);
		if (!appointment) {
			throw new TelehealthSessionNotFoundError();
		}
		if (!canCreateTelehealthSession(appointment)) {
			throw new InvalidTelehealthAppointmentError();
		}
		return appointment;
	}

	private async loadVisible(
		id: string,
	): Promise<{session: TelehealthSession; appointment: Appointment}> {
		const scope = this.tenant.require();
		const read = resolveTelehealthReadScope(scope.role);
		if (read === 'denied') {
			throw new PermissionDeniedError();
		}
		const session = await this.sessions.getById(id);
		if (!session) {
			throw new TelehealthSessionNotFoundError();
		}
		const appointment = session.appointment ?? (await this.appointments.getById(session.appointmentId));
		if (!appointment) {
			throw new TelehealthSessionNotFoundError();
		}
		if (read.kind === 'assigned' && !(await this.patients.isAssigned(appointment.patientId, scope.actorUserId))) {
			throw new TelehealthSessionNotFoundError();
		}
		if (read.kind === 'own') {
			const patient = appointment.patient ?? (await this.patients.getById(appointment.patientId));
			if (!patient || patient.portalUserId !== scope.actorUserId) {
				throw new TelehealthSessionNotFoundError();
			}
		}
		const current = await this.applyGraceExpiry(session, appointment);
		return {session: current, appointment};
	}

	private async assertCanJoin(appointment: Appointment): Promise<void> {
		const scope = this.tenant.require();
		const isAssigned =
			scope.role === 'NURSE'
				? await this.patients.isAssigned(appointment.patientId, scope.actorUserId)
				: false;
		const portalUserId = appointment.patient?.portalUserId ?? null;
		if (
			!isVisitJoinParticipant({
				actorUserId: scope.actorUserId,
				providerUserId: appointment.providerUserId,
				portalUserId,
				isAssigned,
			})
		) {
			throw new PermissionDeniedError();
		}
	}

	private async applyGraceExpiry(
		session: TelehealthSession,
		appointment: Appointment,
	): Promise<TelehealthSession> {
		if (session.state === 'ended' || !isPastGraceExpiry(appointment.endAt)) {
			return session;
		}
		return this.markEnded(session);
	}

	private async markEnded(session: TelehealthSession): Promise<TelehealthSession> {
		session.state = 'ended';
		session.endedAt = new Date();
		const saved = await this.sessions.save(session);
		await this.recordAudit('telehealth_session.ended', saved.id);
		await this.deleteDailyRoomBestEffort(saved);
		return saved;
	}

	private async deleteDailyRoomBestEffort(session: TelehealthSession): Promise<void> {
		if (!session.dailyRoomName) {
			return;
		}
		try {
			await this.daily.deleteRoom(session.dailyRoomName);
			await this.recordAudit('telehealth_session.media_room_deleted', session.id);
		} catch {
			this.logger.warn(`Daily room delete failed (${getCorrelationId(this.request)})`);
		}
	}

	private async recordAudit(action: string, resourceId: string): Promise<void> {
		await this.audit.record({
			action,
			resourceType: AUDIT_RESOURCE,
			resourceId,
			correlationId: getCorrelationId(this.request),
		});
	}
}

export function toSessionRdo(session: TelehealthSession, appointment: Appointment): TelehealthSessionRdo {
	const rdo: TelehealthSessionRdo = {
		id: session.id,
		appointmentId: session.appointmentId,
		practiceId: session.practiceId,
		patientId: appointment.patientId,
		providerId: appointment.providerUserId,
		start: appointment.startAt.toISOString(),
		end: appointment.endAt.toISOString(),
		type: appointment.type,
		state: session.state,
		waitingStartedAt: session.waitingStartedAt.toISOString(),
		patientName: appointment.patient
			? `${appointment.patient.firstName} ${appointment.patient.lastName}`
			: appointment.patientId,
		providerName: appointment.provider?.email ?? appointment.providerUserId,
		synthetic: session.synthetic,
	};
	if (session.joinedAt) {
		rdo.joinedAt = session.joinedAt.toISOString();
	}
	if (session.endedAt) {
		rdo.endedAt = session.endedAt.toISOString();
	}
	return rdo;
}

function joinWindowExpiresAtUnix(endAt: Date): number {
	return Math.floor((endAt.getTime() + TELEHEALTH_GRACE_MS) / 1000);
}
