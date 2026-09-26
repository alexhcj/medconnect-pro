import {describe, expect, it, vi} from 'vitest';
import type {AuditEventRepository} from '../audit/audit-event.repository.js';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import type {Appointment} from '../persistence/entities/appointment.entity.js';
import type {Patient} from '../persistence/entities/patient.entity.js';
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
		create: vi.fn().mockResolvedValue(sessionRow()),
		save: vi.fn(async (row: TelehealthSession) => row),
	};
	const audit = {
		record: vi.fn().mockResolvedValue({}),
	};
	const request = {correlationId: 'cid-telehealth'} as never;
	const service = new TelehealthSessionService(
		sessions as unknown as TelehealthSessionRepository,
		appointments as unknown as AppointmentRepository,
		patients as unknown as PatientRepository,
		audit as unknown as AuditEventRepository,
		tenant,
		request,
	);
	return {service, sessions, appointments, patients, audit};
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

	it('ends a session for a receptionist and is idempotent when already ended', async () => {
		const receptionist = harness('RECEPTIONIST');
		const ended = await receptionist.service.end(sessionId);
		expect(ended.state).toBe('ended');
		expect(receptionist.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({action: 'telehealth_session.ended', resourceId: sessionId}),
		);

		const already = harness('RECEPTIONIST');
		already.sessions.getById.mockResolvedValue(sessionRow({state: 'ended', endedAt: new Date()}));
		const again = await already.service.end(sessionId);
		expect(again.state).toBe('ended');
		expect(already.audit.record).not.toHaveBeenCalled();
	});
});
