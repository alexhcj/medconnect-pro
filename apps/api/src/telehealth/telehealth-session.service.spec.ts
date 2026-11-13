import {describe, expect, it, vi} from 'vitest';
import type {AuditEventRepository} from '../audit/audit-event.repository.js';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import type {Appointment} from '../persistence/entities/appointment.entity.js';
import type {Patient} from '../persistence/entities/patient.entity.js';
import type {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import type {TelehealthSession} from '../persistence/entities/telehealth-session.entity.js';
import type {User} from '../persistence/entities/user.entity.js';
import type {PatientRepository} from '../practice/patient.repository.js';
import type {AppointmentRepository} from '../scheduling/appointment.repository.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import type {PracticeRole} from '../tenancy/practice-role.js';
import {
	InvalidTelehealthAppointmentError,
	SessionAlreadyEndedError,
	SessionNotJoinableError,
	TelehealthSessionNotFoundError,
} from './telehealth-session.errors.js';
import type {TelehealthSessionRepository} from './telehealth-session.repository.js';
import {TelehealthSessionService} from './telehealth-session.service.js';

const actorId = '00000000-0000-4000-8000-000000000010';
const otherId = '00000000-0000-4000-8000-000000000011';
const providerId = '00000000-0000-4000-8000-000000000012';
const portalId = '00000000-0000-4000-8000-000000000013';
const nurseId = '00000000-0000-4000-8000-000000000014';
const patientId = '00000000-0000-4000-8000-0000000000aa';
const appointmentId = '00000000-0000-4000-8000-0000000000bb';
const sessionId = '00000000-0000-4000-8000-0000000000cc';
const practiceId = '00000000-0000-4000-8000-000000000001';

function aroundNow(startOffsetMs: number, endOffsetMs: number): {startAt: Date; endAt: Date} {
	const now = Date.now();
	return {
		startAt: new Date(now + startOffsetMs),
		endAt: new Date(now + endOffsetMs),
	};
}

function appointmentRow(overrides: Partial<Appointment> = {}): Appointment {
	const window = aroundNow(-5 * 60 * 1000, 55 * 60 * 1000);
	return {
		id: appointmentId,
		practiceId,
		patientId,
		providerUserId: providerId,
		startAt: window.startAt,
		endAt: window.endAt,
		type: 'telehealth',
		state: 'scheduled',
		notes: 'Video follow-up',
		synthetic: true,
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-01T00:00:00.000Z'),
		patient: {
			id: patientId,
			firstName: 'Avery',
			lastName: 'Quinn',
			portalUserId: portalId,
		} as Patient,
		provider: {id: providerId, email: 'jordan.ellis@synthetic.example'} as User,
		...overrides,
	} as Appointment;
}

function sessionRow(overrides: Partial<TelehealthSession> = {}): TelehealthSession {
	const appointment = appointmentRow();
	return {
		id: sessionId,
		practiceId,
		appointmentId,
		state: 'waiting',
		waitingStartedAt: new Date(),
		joinedAt: null,
		endedAt: null,
		dailyRoomName: null,
		synthetic: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		appointment,
		...overrides,
	} as TelehealthSession;
}

function harness(role: PracticeRole, userId = actorId) {
	const tenant = new TenantContext();
	tenant.set({practiceId, actorUserId: userId, role});
	const appointments = {
		getById: vi.fn().mockResolvedValue(appointmentRow()),
	};
	const patients = {
		getById: vi.fn().mockResolvedValue({id: patientId, portalUserId: portalId}),
		isAssigned: vi.fn().mockResolvedValue(false),
	};
	const sessions = {
		getById: vi.fn().mockResolvedValue(sessionRow()),
		getByAppointmentId: vi.fn().mockResolvedValue(undefined),
		listAssignedNurses: vi.fn().mockResolvedValue([]),
		findPersonaKey: vi.fn().mockResolvedValue(null),
		create: vi.fn().mockResolvedValue(sessionRow()),
		save: vi.fn(async (row: TelehealthSession) => row),
		transitionWaitingToInSession: vi.fn<
			(id: string, joinedAt: Date) => Promise<TelehealthSession | undefined>
		>(async (_id, joinedAt) => sessionRow({state: 'in_session', joinedAt})),
	};
	const audit = {
		record: vi.fn().mockResolvedValue({}),
	};
	const daily = {
		createOrGetRoom: vi.fn(async ({sessionId}: {sessionId: string}) => ({
			roomName: `mcp-${sessionId}`,
			roomUrl: `https://unconfigured.invalid/mcp-${sessionId}`,
		})),
		mintMeetingToken: vi.fn(async ({roomName}: {roomName: string}) => ({
			token: `fake-meeting-token-${roomName}`,
		})),
		deleteRoom: vi.fn(async () => undefined),
	};
	const request = {correlationId: 'cid-telehealth'} as never;
	const service = new TelehealthSessionService(
		sessions as unknown as TelehealthSessionRepository,
		appointments as unknown as AppointmentRepository,
		patients as unknown as PatientRepository,
		audit as unknown as AuditEventRepository,
		daily as never,
		tenant,
		request,
	);
	return {service, sessions, appointments, patients, audit, daily};
}

describe('TelehealthSessionService', () => {
	it('creates a waiting session, emits audit, and omits names from the audit payload', async () => {
		const receptionist = harness('RECEPTIONIST');
		const created = await receptionist.service.create({appointmentId});
		expect(created.state).toBe('waiting');
		expect(created.synthetic).toBe(true);
		expect(created.patientName).toBe('Avery Quinn');
		expect(receptionist.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'telehealth_session.created',
				resourceType: 'telehealth_session',
				resourceId: sessionId,
				correlationId: 'cid-telehealth',
			}),
		);
		expect(JSON.stringify(receptionist.audit.record.mock.calls[0])).not.toMatch(/Quinn|Video follow-up/);
	});

	it('returns an existing non-ended session instead of creating a second row', async () => {
		const receptionist = harness('RECEPTIONIST');
		receptionist.sessions.getByAppointmentId.mockResolvedValue(sessionRow());
		const existing = await receptionist.service.create({appointmentId});
		expect(existing.id).toBe(sessionId);
		expect(receptionist.sessions.create).not.toHaveBeenCalled();
	});

	it('rejects creating against an office visit or an already ended session', async () => {
		const receptionist = harness('RECEPTIONIST');
		receptionist.appointments.getById.mockResolvedValue(appointmentRow({type: 'office_visit'}));
		await expect(receptionist.service.create({appointmentId})).rejects.toBeInstanceOf(
			InvalidTelehealthAppointmentError,
		);

		const ended = harness('RECEPTIONIST');
		ended.sessions.getByAppointmentId.mockResolvedValue(sessionRow({state: 'ended', endedAt: new Date()}));
		await expect(ended.service.create({appointmentId})).rejects.toBeInstanceOf(SessionAlreadyEndedError);
	});

	it('denies create and end from a nurse and a patient', async () => {
		const nurse = harness('NURSE', nurseId);
		await expect(nurse.service.create({appointmentId})).rejects.toBeInstanceOf(PermissionDeniedError);
		await expect(nurse.service.end(sessionId)).rejects.toBeInstanceOf(PermissionDeniedError);

		const patient = harness('PATIENT', portalId);
		await expect(patient.service.create({appointmentId})).rejects.toBeInstanceOf(PermissionDeniedError);
	});

	it('adds participants, mediaExpiresAt and a per-caller viewerCanEnd to the session', async () => {
		const nurseMembership = {
			userId: nurseId,
			role: 'NURSE',
			displayName: 'Riley Chen',
		} as PracticeMembership;
		const appointment = appointmentRow({
			providerMembership: {
				userId: providerId,
				role: 'PROVIDER',
				displayName: 'Dr. Jordan Ellis',
			} as PracticeMembership,
		});
		const seen = (role: PracticeRole, userId?: string) => {
			const h = harness(role, userId);
			h.sessions.getById.mockResolvedValue(sessionRow({appointment}));
			h.sessions.listAssignedNurses.mockResolvedValue([nurseMembership]);
			h.patients.isAssigned.mockResolvedValue(role === 'NURSE');
			return h.service.get(sessionId);
		};

		const asProvider = await seen('PROVIDER', providerId);
		expect(asProvider.participants).toEqual([
			{userId: providerId, displayName: 'Dr. Jordan Ellis', role: 'PROVIDER'},
			{userId: portalId, displayName: 'Avery Quinn', role: 'PATIENT'},
			{userId: nurseId, displayName: 'Riley Chen', role: 'NURSE'},
		]);
		expect(asProvider.mediaExpiresAt).toBe(
			new Date(Math.floor((appointment.endAt.getTime() + 15 * 60 * 1000) / 1000) * 1000).toISOString(),
		);
		expect(JSON.stringify(asProvider.participants)).not.toContain('@');

		expect((await seen('PROVIDER', providerId)).viewerCanEnd).toBe(true);
		expect((await seen('PRACTICE_ADMIN')).viewerCanEnd).toBe(true);
		expect((await seen('SUPER_ADMIN')).viewerCanEnd).toBe(true);
		expect((await seen('PROVIDER', otherId)).viewerCanEnd).toBe(false);
		expect((await seen('RECEPTIONIST')).viewerCanEnd).toBe(false);
		expect((await seen('NURSE', nurseId)).viewerCanEnd).toBe(false);
		expect((await seen('PATIENT', portalId)).viewerCanEnd).toBe(false);
	});

	it("returns only the caller's own persona key (FE-065)", async () => {
		const provider = harness('PROVIDER', providerId);
		provider.sessions.findPersonaKey.mockImplementation(async (userId: string) =>
			userId === providerId ? 'provider-jordan-ellis' : 'patient-avery-quinn',
		);
		const own = await provider.service.get(sessionId);
		expect(provider.sessions.findPersonaKey).toHaveBeenCalledWith(providerId);
		expect(own.viewerPersonaKey).toBe('provider-jordan-ellis');
		expect(JSON.stringify(own.participants)).not.toMatch(/persona/i);

		const none = await harness('PROVIDER', providerId).service.get(sessionId);
		expect(none.viewerPersonaKey).toBeNull();
	});

	it('omits the patient participant when the patient has no portal user', async () => {
		const provider = harness('PROVIDER', providerId);
		const unlinked = appointmentRow({
			patient: {id: patientId, firstName: 'Avery', lastName: 'Quinn', portalUserId: null} as Patient,
		});
		provider.sessions.getById.mockResolvedValue(sessionRow({appointment: unlinked}));
		const got = await provider.service.get(sessionId);
		expect(got.participants.map((participant) => participant.role)).toEqual(['PROVIDER']);
		expect(got.participants[0]?.displayName).toBe('Provider');
	});

	it('lets the appointment provider join and records join audit without PHI', async () => {
		const provider = harness('PROVIDER', providerId);
		const joined = await provider.service.join(sessionId);
		expect(joined.state).toBe('in_session');
		expect(joined.joinedAt).toBeDefined();
		expect(provider.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'telehealth_session.joined',
				resourceType: 'telehealth_session',
				resourceId: sessionId,
			}),
		);
		expect(JSON.stringify(provider.audit.record.mock.calls[0])).not.toMatch(/Quinn|jordan\.ellis/);
	});

	it('lets a portal patient and an assigned nurse join, but not a receptionist', async () => {
		const patient = harness('PATIENT', portalId);
		const joined = await patient.service.join(sessionId);
		expect(joined.state).toBe('in_session');

		const nurse = harness('NURSE', nurseId);
		nurse.patients.isAssigned.mockResolvedValue(true);
		const nurseJoined = await nurse.service.join(sessionId);
		expect(nurseJoined.state).toBe('in_session');

		const receptionist = harness('RECEPTIONIST');
		await expect(receptionist.service.join(sessionId)).rejects.toBeInstanceOf(PermissionDeniedError);
	});

	it('resolves the open session for the provider, portal patient, and assigned nurse', async () => {
		const open = sessionRow();
		const provider = harness('PROVIDER', providerId);
		provider.sessions.getByAppointmentId.mockResolvedValue(open);
		const found = await provider.service.findOpenByAppointment(appointmentId);
		expect(found.id).toBe(sessionId);
		expect(found.state).toBe('waiting');
		expect(provider.sessions.create).not.toHaveBeenCalled();

		const patient = harness('PATIENT', portalId);
		patient.sessions.getByAppointmentId.mockResolvedValue(sessionRow({state: 'in_session'}));
		await expect(patient.service.findOpenByAppointment(appointmentId)).resolves.toMatchObject({
			id: sessionId,
			state: 'in_session',
		});

		const nurse = harness('NURSE', nurseId);
		await expect(nurse.service.findOpenByAppointment(appointmentId)).rejects.toBeInstanceOf(
			TelehealthSessionNotFoundError,
		);
		expect(nurse.sessions.getByAppointmentId).not.toHaveBeenCalled();
		expect(nurse.sessions.create).not.toHaveBeenCalled();

		nurse.patients.isAssigned.mockResolvedValue(true);
		nurse.sessions.getByAppointmentId.mockResolvedValue(open);
		await expect(nurse.service.findOpenByAppointment(appointmentId)).resolves.toMatchObject({
			id: sessionId,
		});
	});

	it('hides open-session lookup from non-participants and ended rows', async () => {
		const receptionist = harness('RECEPTIONIST');
		receptionist.sessions.getByAppointmentId.mockResolvedValue(sessionRow());
		await expect(receptionist.service.findOpenByAppointment(appointmentId)).rejects.toBeInstanceOf(
			TelehealthSessionNotFoundError,
		);
		expect(receptionist.sessions.getByAppointmentId).not.toHaveBeenCalled();
		expect(receptionist.sessions.create).not.toHaveBeenCalled();
		expect(receptionist.sessions.save).not.toHaveBeenCalled();

		const otherProvider = harness('PROVIDER');
		await expect(otherProvider.service.findOpenByAppointment(appointmentId)).rejects.toBeInstanceOf(
			TelehealthSessionNotFoundError,
		);

		const otherPatient = harness('PATIENT', otherId);
		await expect(otherPatient.service.findOpenByAppointment(appointmentId)).rejects.toBeInstanceOf(
			TelehealthSessionNotFoundError,
		);

		const missing = harness('PROVIDER', providerId);
		missing.appointments.getById.mockResolvedValue(undefined);
		await expect(missing.service.findOpenByAppointment(appointmentId)).rejects.toBeInstanceOf(
			TelehealthSessionNotFoundError,
		);
		expect(missing.sessions.create).not.toHaveBeenCalled();

		const ended = harness('PROVIDER', providerId);
		ended.sessions.getByAppointmentId.mockResolvedValue(sessionRow({state: 'ended', endedAt: new Date()}));
		await expect(ended.service.findOpenByAppointment(appointmentId)).rejects.toBeInstanceOf(
			TelehealthSessionNotFoundError,
		);
		expect(ended.sessions.create).not.toHaveBeenCalled();
		expect(ended.audit.record).not.toHaveBeenCalled();
	});

	it('lazy-ends an ineligible session on lookup for a participant only', async () => {
		const provider = harness('PROVIDER', providerId);
		const cancelled = appointmentRow({state: 'cancelled'});
		provider.appointments.getById.mockResolvedValue(cancelled);
		provider.sessions.getByAppointmentId.mockResolvedValue(sessionRow({appointment: cancelled}));
		await expect(provider.service.findOpenByAppointment(appointmentId)).rejects.toBeInstanceOf(
			TelehealthSessionNotFoundError,
		);
		expect(provider.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({action: 'telehealth_session.ended', resourceId: sessionId}),
		);

		const receptionist = harness('RECEPTIONIST');
		receptionist.appointments.getById.mockResolvedValue(cancelled);
		await expect(receptionist.service.findOpenByAppointment(appointmentId)).rejects.toBeInstanceOf(
			TelehealthSessionNotFoundError,
		);
		expect(receptionist.sessions.getByAppointmentId).not.toHaveBeenCalled();
		expect(receptionist.audit.record).not.toHaveBeenCalled();
	});

	it('hides sessions from an unassigned nurse and another portal user', async () => {
		const nurse = harness('NURSE', nurseId);
		await expect(nurse.service.get(sessionId)).rejects.toBeInstanceOf(TelehealthSessionNotFoundError);

		const otherPatient = harness('PATIENT', otherId);
		await expect(otherPatient.service.get(sessionId)).rejects.toBeInstanceOf(TelehealthSessionNotFoundError);
	});

	it('rejects join outside the grace window and ends sessions after expiry', async () => {
		const provider = harness('PROVIDER', providerId);
		const future = appointmentRow(aroundNow(60 * 60 * 1000, 2 * 60 * 60 * 1000));
		provider.sessions.getById.mockResolvedValue(sessionRow({appointment: future}));
		await expect(provider.service.join(sessionId)).rejects.toBeInstanceOf(SessionNotJoinableError);

		const expired = appointmentRow(aroundNow(-3 * 60 * 60 * 1000, -2 * 60 * 60 * 1000));
		const waiting = sessionRow({appointment: expired});
		provider.sessions.getById.mockResolvedValue(waiting);
		const got = await provider.service.get(sessionId);
		expect(got.state).toBe('ended');
		expect(provider.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({action: 'telehealth_session.ended', resourceId: sessionId}),
		);
	});

	it('ends a session for the appointment provider and is idempotent when already ended', async () => {
		const provider = harness('PROVIDER', providerId);
		const ended = await provider.service.end(sessionId);
		expect(ended.state).toBe('ended');
		expect(provider.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({action: 'telehealth_session.ended', resourceId: sessionId}),
		);

		const already = harness('PROVIDER', providerId);
		already.sessions.getById.mockResolvedValue(sessionRow({state: 'ended', endedAt: new Date()}));
		const again = await already.service.end(sessionId);
		expect(again.state).toBe('ended');
		expect(already.audit.record).not.toHaveBeenCalled();
	});

	it('lets a practice admin end a visit and forbids a receptionist or another provider', async () => {
		const admin = harness('PRACTICE_ADMIN');
		await expect(admin.service.end(sessionId)).resolves.toMatchObject({state: 'ended'});

		const receptionist = harness('RECEPTIONIST');
		await expect(receptionist.service.end(sessionId)).rejects.toBeInstanceOf(PermissionDeniedError);
		expect(receptionist.audit.record).not.toHaveBeenCalled();

		const otherProvider = harness('PROVIDER', otherId);
		await expect(otherProvider.service.end(sessionId)).rejects.toBeInstanceOf(PermissionDeniedError);

		const endedAlready = harness('RECEPTIONIST');
		endedAlready.sessions.getById.mockResolvedValue(sessionRow({state: 'ended', endedAt: new Date()}));
		await expect(endedAlready.service.end(sessionId)).rejects.toBeInstanceOf(PermissionDeniedError);
	});

	it('mints a media token for visit participants, reuses the room, and omits the token from audit', async () => {
		const provider = harness('PROVIDER', providerId);
		provider.sessions.getById.mockResolvedValue(sessionRow({state: 'in_session', joinedAt: new Date()}));
		const first = await provider.service.mintMediaToken(sessionId);
		expect(first.roomUrl).toBe(`https://unconfigured.invalid/mcp-${sessionId}`);
		expect(first.token).toBe(`fake-meeting-token-mcp-${sessionId}`);
		expect(provider.sessions.save).toHaveBeenCalled();
		expect(provider.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'telehealth_session.media_token_minted',
				resourceType: 'telehealth_session',
				resourceId: sessionId,
			}),
		);
		expect(JSON.stringify(provider.audit.record.mock.calls)).not.toContain(first.token);
		expect(JSON.stringify(provider.audit.record.mock.calls)).not.toMatch(/Quinn/);

		provider.sessions.getById.mockResolvedValue(
			sessionRow({state: 'in_session', joinedAt: new Date(), dailyRoomName: `mcp-${sessionId}`}),
		);
		provider.sessions.save.mockClear();
		const second = await provider.service.mintMediaToken(sessionId);
		expect(second.roomUrl).toBe(first.roomUrl);
		expect(provider.sessions.save).not.toHaveBeenCalled();

		const receptionist = harness('RECEPTIONIST');
		await expect(receptionist.service.mintMediaToken(sessionId)).rejects.toBeInstanceOf(
			PermissionDeniedError,
		);

		const nurse = harness('NURSE', nurseId);
		await expect(nurse.service.mintMediaToken(sessionId)).rejects.toBeInstanceOf(
			TelehealthSessionNotFoundError,
		);
		nurse.patients.isAssigned.mockResolvedValue(true);
		nurse.sessions.getById.mockResolvedValue(sessionRow({state: 'in_session', joinedAt: new Date()}));
		await expect(nurse.service.mintMediaToken(sessionId)).resolves.toMatchObject({
			roomUrl: first.roomUrl,
		});
	});

	it('accepts a heartbeat from visit participants only, without writing or auditing', async () => {
		const inSession = () => sessionRow({state: 'in_session', joinedAt: new Date()});

		const provider = harness('PROVIDER', providerId);
		provider.sessions.getById.mockResolvedValue(inSession());
		await expect(provider.service.heartbeat(sessionId)).resolves.toBeUndefined();
		expect(provider.audit.record).not.toHaveBeenCalled();
		expect(provider.sessions.save).not.toHaveBeenCalled();
		expect(provider.daily.createOrGetRoom).not.toHaveBeenCalled();

		const patient = harness('PATIENT', portalId);
		patient.sessions.getById.mockResolvedValue(inSession());
		await expect(patient.service.heartbeat(sessionId)).resolves.toBeUndefined();

		const nurse = harness('NURSE', nurseId);
		nurse.patients.isAssigned.mockResolvedValue(true);
		nurse.sessions.getById.mockResolvedValue(inSession());
		await expect(nurse.service.heartbeat(sessionId)).resolves.toBeUndefined();

		const receptionist = harness('RECEPTIONIST');
		receptionist.sessions.getById.mockResolvedValue(inSession());
		await expect(receptionist.service.heartbeat(sessionId)).rejects.toBeInstanceOf(
			PermissionDeniedError,
		);

		const unassignedNurse = harness('NURSE', nurseId);
		unassignedNurse.sessions.getById.mockResolvedValue(inSession());
		await expect(unassignedNurse.service.heartbeat(sessionId)).rejects.toBeInstanceOf(
			TelehealthSessionNotFoundError,
		);
	});

	it('rejects a heartbeat for waiting, ended and past-grace sessions', async () => {
		const waiting = harness('PROVIDER', providerId);
		await expect(waiting.service.heartbeat(sessionId)).rejects.toBeInstanceOf(SessionNotJoinableError);

		const ended = harness('PROVIDER', providerId);
		ended.sessions.getById.mockResolvedValue(sessionRow({state: 'ended', endedAt: new Date()}));
		await expect(ended.service.heartbeat(sessionId)).rejects.toBeInstanceOf(SessionNotJoinableError);

		const pastGrace = harness('PROVIDER', providerId);
		const expired = appointmentRow(aroundNow(-3 * 60 * 60 * 1000, -2 * 60 * 60 * 1000));
		pastGrace.sessions.getById.mockResolvedValue(
			sessionRow({state: 'in_session', joinedAt: new Date(), appointment: expired}),
		);
		await expect(pastGrace.service.heartbeat(sessionId)).rejects.toBeInstanceOf(SessionNotJoinableError);
		expect(pastGrace.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({action: 'telehealth_session.ended'}),
		);

		const cancelled = harness('PROVIDER', providerId);
		cancelled.sessions.getById.mockResolvedValue(
			sessionRow({
				state: 'in_session',
				joinedAt: new Date(),
				appointment: appointmentRow({state: 'cancelled'}),
			}),
		);
		await expect(cancelled.service.heartbeat(sessionId)).rejects.toBeInstanceOf(SessionNotJoinableError);
	});

	it('rejects media-token while the Nest session is still waiting', async () => {
		const provider = harness('PROVIDER', providerId);
		await expect(provider.service.mintMediaToken(sessionId)).rejects.toBeInstanceOf(
			SessionNotJoinableError,
		);
		expect(provider.daily.mintMeetingToken).not.toHaveBeenCalled();
	});

	it('lazy-ends a session when the linked appointment is cancelled or completed', async () => {
		const provider = harness('PROVIDER', providerId);
		const cancelled = appointmentRow({state: 'cancelled'});
		provider.sessions.getById.mockResolvedValue(sessionRow({appointment: cancelled}));
		const got = await provider.service.get(sessionId);
		expect(got.state).toBe('ended');
		expect(provider.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({action: 'telehealth_session.ended', resourceId: sessionId}),
		);
		await expect(provider.service.join(sessionId)).rejects.toBeInstanceOf(SessionNotJoinableError);
		await expect(provider.service.mintMediaToken(sessionId)).rejects.toBeInstanceOf(
			SessionNotJoinableError,
		);
		expect(provider.daily.mintMeetingToken).not.toHaveBeenCalled();
	});

	it('does not double-audit join when a concurrent join already moved the session', async () => {
		const provider = harness('PROVIDER', providerId);
		provider.sessions.transitionWaitingToInSession.mockImplementation(async () => undefined);
		provider.sessions.getById
			.mockResolvedValueOnce(sessionRow())
			.mockResolvedValueOnce(sessionRow({state: 'in_session', joinedAt: new Date()}));
		const joined = await provider.service.join(sessionId);
		expect(joined.state).toBe('in_session');
		expect(provider.audit.record).not.toHaveBeenCalledWith(
			expect.objectContaining({action: 'telehealth_session.joined'}),
		);
	});

	it('rejects media-token outside the join window and does not change session state', async () => {
		const provider = harness('PROVIDER', providerId);
		const future = appointmentRow(aroundNow(60 * 60 * 1000, 2 * 60 * 60 * 1000));
		provider.sessions.getById.mockResolvedValue(
			sessionRow({state: 'in_session', joinedAt: new Date(), appointment: future}),
		);
		await expect(provider.service.mintMediaToken(sessionId)).rejects.toBeInstanceOf(
			SessionNotJoinableError,
		);
		expect(provider.daily.mintMeetingToken).not.toHaveBeenCalled();
		const got = await provider.service.get(sessionId);
		expect(got.state).toBe('in_session');
	});

	it('ends the Nest session even when Daily room delete fails', async () => {
		const provider = harness('PROVIDER', providerId);
		provider.sessions.getById.mockResolvedValue(
			sessionRow({dailyRoomName: `mcp-${sessionId}`}),
		);
		provider.daily.deleteRoom.mockRejectedValue(new Error('Daily timeout'));
		const ended = await provider.service.end(sessionId);
		expect(ended.state).toBe('ended');
		expect(provider.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({action: 'telehealth_session.ended', resourceId: sessionId}),
		);
		expect(provider.audit.record).not.toHaveBeenCalledWith(
			expect.objectContaining({action: 'telehealth_session.media_room_deleted'}),
		);
	});
});
