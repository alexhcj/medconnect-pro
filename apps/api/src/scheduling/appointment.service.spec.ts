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
import {AppointmentService} from './appointment.service.js';
import type {AppointmentCreateBody} from './appointment.schema.js';

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
	const request = {correlationId: 'cid-test'} as never;
	const service = new AppointmentService(
		appointments as unknown as AppointmentRepository,
		patients as unknown as PatientRepository,
		memberships as unknown as MembershipRepository,
		audit as unknown as AuditEventRepository,
		tenant,
		request,
	);
	return {service, appointments, patients, memberships, audit};
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

		const patient = harness('PATIENT');
		await expect(patient.service.create(createBody)).rejects.toBeInstanceOf(PermissionDeniedError);
	});

	it('creates an appointment, emits audit, and omits notes from the audit payload', async () => {
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
	});
});
