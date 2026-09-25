import {describe, expect, it, vi} from 'vitest';
import type {AuditEventRepository} from '../audit/audit-event.repository.js';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import type {Patient} from '../persistence/entities/patient.entity.js';
import type {MembershipRepository} from '../practice/membership.repository.js';
import type {PatientRepository} from '../practice/patient.repository.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import type {PracticeRole} from '../tenancy/practice-role.js';
import {PatientNotFoundError} from './patient.errors.js';
import {PatientService} from './patient.service.js';
import type {PatientCreateBody} from './patient.schema.js';

const actorId = '00000000-0000-4000-8000-000000000010';
const otherId = '00000000-0000-4000-8000-000000000011';
const providerId = '00000000-0000-4000-8000-000000000012';

function patientRow(overrides: Partial<Patient> = {}): Patient {
	return {
		id: '00000000-0000-4000-8000-0000000000aa',
		practiceId: '00000000-0000-4000-8000-000000000001',
		firstName: 'Avery',
		lastName: 'Quinn',
		dateOfBirth: '1988-04-12',
		gender: 'female',
		status: 'active',
		phone: '555-0100',
		email: 'avery.quinn@synthetic.example',
		street: '100 Demo Street',
		city: 'Harborview',
		state: 'WA',
		postalCode: '98101',
		emergencyContactName: 'Sky Quinn',
		emergencyContactRelationship: 'Sibling',
		emergencyContactPhone: '555-0101',
		insuranceProvider: 'Synthetic Health Plan',
		insurancePolicyNumber: 'SYN-100',
		insuranceGroupNumber: 'GRP-1',
		assignedProviderUserId: providerId,
		portalUserId: actorId,
		synthetic: true,
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-01T00:00:00.000Z'),
		...overrides,
	} as Patient;
}

const createBody: PatientCreateBody = {
	firstName: 'Riley',
	lastName: 'Chen',
	dateOfBirth: '1991-02-02',
	gender: 'non-binary',
	status: 'active',
	phone: '555-0199',
	email: 'riley.chen@synthetic.example',
	address: {street: '10 Demo Lane', city: 'Harborview', state: 'WA', postalCode: '98101'},
	emergencyContact: {name: 'Jordan Chen', relationship: 'Parent', phone: '555-0188'},
	insurance: {provider: 'Synthetic Health Plan', policyNumber: 'SYN-200', groupNumber: 'GRP-2'},
	providerId,
};

function harness(role: PracticeRole, userId = actorId) {
	const tenant = new TenantContext();
	tenant.set({
		practiceId: '00000000-0000-4000-8000-000000000001',
		actorUserId: userId,
		role,
	});
	const patients = {
		search: vi.fn().mockResolvedValue({patients: [patientRow()], hasMore: false}),
		getById: vi.fn().mockResolvedValue(patientRow()),
		isAssigned: vi.fn().mockResolvedValue(false),
		create: vi.fn().mockResolvedValue(patientRow({firstName: 'Riley'})),
		update: vi.fn().mockResolvedValue(patientRow({phone: '555-0102'})),
	};
	const memberships = {
		list: vi.fn().mockResolvedValue([{userId: providerId, role: 'PROVIDER'}]),
	};
	const audit = {
		record: vi.fn().mockResolvedValue({}),
	};
	const request = {correlationId: 'cid-patient'} as never;
	const service = new PatientService(
		patients as unknown as PatientRepository,
		memberships as unknown as MembershipRepository,
		tenant,
		audit as unknown as AuditEventRepository,
		request,
	);
	return {service, patients, memberships, audit};
}

describe('PatientService', () => {
	it('lists the practice for a receptionist and only assignments for a nurse', async () => {
		const receptionist = harness('RECEPTIONIST');
		await receptionist.service.list({});
		expect(receptionist.patients.search).toHaveBeenCalledWith(
			expect.objectContaining({assignedToUserId: undefined, portalUserId: undefined}),
		);

		const nurse = harness('NURSE');
		await nurse.service.list({q: 'quinn'});
		expect(nurse.patients.search).toHaveBeenCalledWith(
			expect.objectContaining({assignedToUserId: actorId, q: 'quinn'}),
		);
	});

	it('lists only the portal record for a patient user', async () => {
		const patient = harness('PATIENT');
		await patient.service.list({});
		expect(patient.patients.search).toHaveBeenCalledWith(
			expect.objectContaining({portalUserId: actorId}),
		);
	});

	it('hides an in-tenant patient from an unassigned nurse', async () => {
		const nurse = harness('NURSE');
		await expect(nurse.service.get(patientRow().id)).rejects.toBeInstanceOf(PatientNotFoundError);
	});

	it('hides another patient record from a portal user', async () => {
		const patient = harness('PATIENT');
		patient.patients.getById.mockResolvedValue(patientRow({portalUserId: otherId}));
		await expect(patient.service.get(patientRow().id)).rejects.toBeInstanceOf(PatientNotFoundError);
	});

	it('returns the portal user their own record', async () => {
		const patient = harness('PATIENT');
		const row = await patient.service.get(patientRow().id);
		expect(row.id).toBe(patientRow().id);
		expect(row).not.toHaveProperty('conditions');
	});

	it('denies demographic writes from a provider', async () => {
		const provider = harness('PROVIDER', providerId);
		await expect(provider.service.create(createBody)).rejects.toBeInstanceOf(PermissionDeniedError);
		expect(provider.patients.create).not.toHaveBeenCalled();
	});

	it('creates a patient when the caller can write and the provider is in practice', async () => {
		const receptionist = harness('RECEPTIONIST');
		const created = await receptionist.service.create(createBody);
		expect(created.firstName).toBe('Riley');
		expect(receptionist.patients.create).toHaveBeenCalledWith(
			expect.objectContaining({providerId, street: '10 Demo Lane'}),
		);
		expect(receptionist.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'patient.created',
				resourceType: 'patient',
			}),
		);
		expect(JSON.stringify(receptionist.audit.record.mock.calls[0])).not.toMatch(/Riley|Chen/);
	});

	it('audits a successful patient profile read without demographics', async () => {
		const patient = harness('PATIENT');
		await patient.service.get(patientRow().id);
		expect(patient.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'patient.accessed',
				resourceType: 'patient',
				resourceId: patientRow().id,
			}),
		);
		expect(JSON.stringify(patient.audit.record.mock.calls[0])).not.toMatch(/Avery|Quinn/);
	});
});
