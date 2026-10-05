import {describe, expect, it, vi} from 'vitest';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import type {Appointment} from '../persistence/entities/appointment.entity.js';
import type {Patient} from '../persistence/entities/patient.entity.js';
import type {User} from '../persistence/entities/user.entity.js';
import type {MembershipRepository} from '../practice/membership.repository.js';
import type {PatientRepository} from '../practice/patient.repository.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import type {PracticeRole} from '../tenancy/practice-role.js';
import {AppointmentConflictError, AppointmentNotFoundError} from './appointment.errors.js';
import type {AppointmentRepository} from './appointment.repository.js';
import type {AuditEventRepository} from '../audit/audit-event.repository.js';
import type {NotificationService} from '../notifications/notification.service.js';
import {AppointmentService} from './appointment.service.js';
import type {AppointmentCreateBody, AppointmentUpdateBody} from './appointment.schema.js';

const actorId = '00000000-0000-4000-8000-000000000010';
const otherId = '00000000-0000-4000-8000-000000000011';
const providerId = '00000000-0000-4000-8000-000000000012';
const patientId = '00000000-0000-4000-8000-0000000000aa';
const appointmentId = '00000000-0000-4000-8000-0000000000bb';
const practiceId = '00000000-0000-4000-8000-000000000001';

function appointmentRow(overrides: Partial<Appointment> = {}): Appointment {
	return {
		id: appointmentId,
		practiceId,
		patientId,
		providerUserId: providerId,
		startAt: new Date('2026-10-15T14:00:00.000Z'),
		endAt: new Date('2026-10-15T15:00:00.000Z'),
		type: 'office_visit',
		state: 'scheduled',
		notes: 'Annual follow-up',
		synthetic: true,
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-01T00:00:00.000Z'),
		patient: {
			id: patientId,
			firstName: 'Avery',
			lastName: 'Quinn',
			portalUserId: actorId,
		} as Patient,
		provider: {id: providerId, email: 'jordan.ellis@synthetic.example'} as User,
		...overrides,
	} as Appointment;
}

const createBody: AppointmentCreateBody = {
	patientId,
	providerId,
	start: '2026-10-20T10:00:00.000Z',
	end: '2026-10-20T11:00:00.000Z',
	type: 'office_visit',
	state: 'scheduled',
	notes: 'Follow-up',
};

function harness(role: PracticeRole, userId = actorId) {
	const tenant = new TenantContext();
	tenant.set({practiceId, actorUserId: userId, role});
	const appointments = {
		search: vi.fn().mockResolvedValue({appointments: [appointmentRow()], hasMore: false}),
		getById: vi.fn().mockResolvedValue(appointmentRow()),
		listProviderBusy: vi.fn().mockResolvedValue([]),
		create: vi.fn().mockResolvedValue(appointmentRow({notes: 'Follow-up'})),
		update: vi.fn().mockResolvedValue(appointmentRow({state: 'cancelled'})),
		remove: vi.fn().mockResolvedValue(true),
	};
	const patients = {
		getById: vi.fn().mockResolvedValue({id: patientId, portalUserId: actorId}),
		isAssigned: vi.fn().mockResolvedValue(false),
	};
	const memberships = {
		list: vi.fn().mockResolvedValue([{userId: providerId, role: 'PROVIDER'}]),
	};
	const audit = {
		record: vi.fn().mockResolvedValue({}),
	};
	const notificationService = {
		enqueue: vi.fn().mockResolvedValue(undefined),
	};
	const request = {correlationId: 'cid-test'} as never;
	const service = new AppointmentService(
		appointments as unknown as AppointmentRepository,
		patients as unknown as PatientRepository,
		memberships as unknown as MembershipRepository,
		audit as unknown as AuditEventRepository,
		notificationService as unknown as NotificationService,
		tenant,
		request,
	);
	return {service, appointments, patients, memberships, audit, notificationService};
}

describe('AppointmentService', () => {
	it('lists the practice for a receptionist and only assignments for a nurse', async () => {
		const receptionist = harness('RECEPTIONIST');
		await receptionist.service.list({});
		expect(receptionist.appointments.search).toHaveBeenCalledWith(
			expect.objectContaining({assignedToUserId: undefined, portalUserId: undefined}),
		);

		const nurse = harness('NURSE');
		await nurse.service.list({});
		expect(nurse.appointments.search).toHaveBeenCalledWith(
			expect.objectContaining({assignedToUserId: actorId}),
		);
	});

	it('lists only the portal user’s appointments', async () => {
		const patient = harness('PATIENT');
		await patient.service.list({});
		expect(patient.appointments.search).toHaveBeenCalledWith(
			expect.objectContaining({portalUserId: actorId}),
		);
	});

	it('hides an in-tenant appointment from an unassigned nurse', async () => {
		const nurse = harness('NURSE');
		await expect(nurse.service.get(appointmentId)).rejects.toBeInstanceOf(AppointmentNotFoundError);
	});

	it('hides another patient’s appointment from a portal user', async () => {
		const patient = harness('PATIENT');
		patient.patients.getById.mockResolvedValue({id: patientId, portalUserId: otherId});
		await expect(patient.service.get(appointmentId)).rejects.toBeInstanceOf(AppointmentNotFoundError);
	});

	it('denies writes from a nurse and a patient', async () => {
		const nurse = harness('NURSE');
		await expect(nurse.service.create(createBody)).rejects.toBeInstanceOf(PermissionDeniedError);
		expect(nurse.appointments.create).not.toHaveBeenCalled();
		expect(nurse.notificationService.enqueue).not.toHaveBeenCalled();

		const patient = harness('PATIENT');
		await expect(patient.service.create(createBody)).rejects.toBeInstanceOf(PermissionDeniedError);
		expect(patient.notificationService.enqueue).not.toHaveBeenCalled();
	});

	it('creates an appointment, emits audit, and enqueues recipients without notes', async () => {
		const receptionist = harness('RECEPTIONIST');
		const created = await receptionist.service.create(createBody);
		expect(created.patientName).toBe('Avery Quinn');
		expect(created.synthetic).toBe(true);
		expect(receptionist.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'appointment.created',
				resourceType: 'appointment',
				resourceId: appointmentId,
				correlationId: 'cid-test',
			}),
		);
		expect(JSON.stringify(receptionist.audit.record.mock.calls[0])).not.toMatch(/Follow-up|Quinn/);
		expect(receptionist.notificationService.enqueue).toHaveBeenCalledTimes(2);
		expect(receptionist.notificationService.enqueue).toHaveBeenCalledWith({
			recipientUserId: providerId,
			type: 'appointment_changed',
			title: 'Appointment scheduled',
			body: 'A visit was added to your schedule.',
		});
		expect(receptionist.notificationService.enqueue).toHaveBeenCalledWith({
			recipientUserId: actorId,
			type: 'appointment_changed',
			title: 'Appointment scheduled',
			body: 'A visit was added to your schedule.',
		});
		expect(JSON.stringify(receptionist.notificationService.enqueue.mock.calls)).not.toMatch(
			/Follow-up|Quinn|Annual/,
		);
	});

	it('enqueues only the provider when the patient has no portal login', async () => {
		const receptionist = harness('RECEPTIONIST');
		receptionist.appointments.create.mockResolvedValue(
			appointmentRow({notes: 'Follow-up', patient: {id: patientId, portalUserId: null} as Patient}),
		);
		await receptionist.service.create(createBody);
		expect(receptionist.notificationService.enqueue).toHaveBeenCalledTimes(1);
		expect(receptionist.notificationService.enqueue).toHaveBeenCalledWith(
			expect.objectContaining({recipientUserId: providerId}),
		);
	});

	it('enqueues on cancel and delete, but not on a non-cancel update', async () => {
		const receptionist = harness('RECEPTIONIST');
		await receptionist.service.update(appointmentId, {state: 'cancelled'} as AppointmentUpdateBody);
		expect(receptionist.notificationService.enqueue).toHaveBeenCalledTimes(2);
		expect(receptionist.notificationService.enqueue).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Appointment cancelled',
				body: 'A visit was cancelled.',
			}),
		);

		const confirmed = harness('RECEPTIONIST');
		confirmed.appointments.update.mockResolvedValue(appointmentRow({state: 'confirmed'}));
		await confirmed.service.update(appointmentId, {state: 'confirmed'} as AppointmentUpdateBody);
		expect(confirmed.notificationService.enqueue).not.toHaveBeenCalled();

		const deleted = harness('RECEPTIONIST');
		await deleted.service.remove(appointmentId);
		expect(deleted.notificationService.enqueue).toHaveBeenCalledTimes(2);
		expect(deleted.notificationService.enqueue).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Appointment removed',
				body: 'A visit was removed from the schedule.',
			}),
		);
		expect(JSON.stringify(deleted.notificationService.enqueue.mock.calls)).not.toMatch(
			/Follow-up|Quinn|Annual/,
		);
	});

	it('rejects overlapping provider times', async () => {
		const receptionist = harness('RECEPTIONIST');
		receptionist.appointments.listProviderBusy.mockResolvedValue([
			{
				appointmentId: 'other',
				startAt: new Date('2026-10-20T10:30:00.000Z'),
				endAt: new Date('2026-10-20T11:30:00.000Z'),
			},
		]);
		await expect(receptionist.service.create(createBody)).rejects.toBeInstanceOf(AppointmentConflictError);
		expect(receptionist.appointments.create).not.toHaveBeenCalled();
		expect(receptionist.notificationService.enqueue).not.toHaveBeenCalled();
	});
});
