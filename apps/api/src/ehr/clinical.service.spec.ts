import {describe, expect, it, vi} from 'vitest';
import type {AuditEventRepository} from '../audit/audit-event.repository.js';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import {PatientNotFoundError} from '../patient/patient.errors.js';
import type {ClinicalCondition} from '../persistence/entities/clinical-condition.entity.js';
import type {ClinicalHistory} from '../persistence/entities/clinical-history.entity.js';
import type {Medication} from '../persistence/entities/medication.entity.js';
import type {Patient} from '../persistence/entities/patient.entity.js';
import type {Vital} from '../persistence/entities/vital.entity.js';
import type {PatientRepository} from '../practice/patient.repository.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import type {PracticeRole} from '../tenancy/practice-role.js';
import type {ClinicalConditionRepository} from './clinical-condition.repository.js';
import type {ClinicalHistoryRepository} from './clinical-history.repository.js';
import {ClinicalService} from './clinical.service.js';
import type {MedicationRepository} from './medication.repository.js';
import type {VitalRepository} from './vital.repository.js';

const actorId = '00000000-0000-4000-8000-000000000010';
const otherId = '00000000-0000-4000-8000-000000000011';
const patientId = '00000000-0000-4000-8000-0000000000aa';
const practiceId = '00000000-0000-4000-8000-000000000001';
const resourceId = '00000000-0000-4000-8000-0000000000cc';

function patientRow(overrides: Partial<Patient> = {}): Patient {
	return {
		id: patientId,
		practiceId,
		portalUserId: actorId,
		...overrides,
	} as Patient;
}

function historyRow(): ClinicalHistory {
	return {
		id: resourceId,
		practiceId,
		patientId,
		type: 'visit',
		occurredAt: new Date('2025-07-15T10:30:00.000Z'),
		title: 'Hypertension follow-up',
		summary: 'Blood pressure stable on current medication.',
		providerUserId: actorId,
		status: 'completed',
		synthetic: true,
	} as ClinicalHistory;
}

function conditionRow(): ClinicalCondition {
	return {
		id: resourceId,
		practiceId,
		patientId,
		display: 'Hypertension',
		clinicalStatus: 'active',
		recordedAt: new Date('2025-07-15T10:30:00.000Z'),
		recordedByUserId: actorId,
		synthetic: true,
	} as ClinicalCondition;
}

function vitalRow(): Vital {
	return {
		id: resourceId,
		practiceId,
		patientId,
		recordedAt: new Date('2025-07-15T10:15:00.000Z'),
		systolicMmHg: 128,
		diastolicMmHg: 82,
		heartRateBpm: 72,
		temperatureC: 36.7,
		respiratoryRate: 16,
		spo2Percent: 98,
		weightKg: 72.5,
		recordedByUserId: actorId,
		synthetic: true,
	} as Vital;
}

function medicationRow(): Medication {
	return {
		id: resourceId,
		practiceId,
		patientId,
		name: 'Lisinopril',
		dosage: '10mg',
		frequency: 'Once daily',
		route: 'oral',
		startDate: '2023-01-10',
		endDate: null,
		prescriberUserId: actorId,
		instructions: 'Take in the morning with water',
		status: 'active',
		synthetic: true,
	} as Medication;
}

function harness(role: PracticeRole, userId = actorId) {
	const tenant = new TenantContext();
	tenant.set({practiceId, actorUserId: userId, role});
	const history = {
		listByPatient: vi.fn().mockResolvedValue([historyRow()]),
		create: vi.fn().mockResolvedValue(historyRow()),
	};
	const conditions = {
		listByPatient: vi.fn().mockResolvedValue([conditionRow()]),
		create: vi.fn().mockResolvedValue(conditionRow()),
	};
	const vitals = {
		listByPatient: vi.fn().mockResolvedValue([vitalRow()]),
		create: vi.fn().mockResolvedValue(vitalRow()),
	};
	const medications = {
		listByPatient: vi.fn().mockResolvedValue([medicationRow()]),
		create: vi.fn().mockResolvedValue(medicationRow()),
	};
	const patients = {
		getById: vi.fn().mockResolvedValue(patientRow()),
		isAssigned: vi.fn().mockResolvedValue(false),
	};
	const audit = {
		record: vi.fn().mockResolvedValue({}),
	};
	const request = {correlationId: 'cid-clinical'} as never;
	const service = new ClinicalService(
		history as unknown as ClinicalHistoryRepository,
		conditions as unknown as ClinicalConditionRepository,
		vitals as unknown as VitalRepository,
		medications as unknown as MedicationRepository,
		patients as unknown as PatientRepository,
		audit as unknown as AuditEventRepository,
		tenant,
		request,
	);
	return {service, history, conditions, vitals, medications, patients, audit};
}

const historyBody = {
	type: 'visit' as const,
	occurredAt: '2025-07-15T10:30:00.000Z',
	title: 'Hypertension follow-up',
	summary: 'Blood pressure stable on current medication.',
	status: 'completed' as const,
};

const vitalBody = {
	recordedAt: '2025-07-15T10:15:00.000Z',
	systolicMmHg: 128,
	diastolicMmHg: 82,
	heartRateBpm: 72,
	temperatureC: 36.7,
	respiratoryRate: 16,
	spo2Percent: 98,
	weightKg: 72.5,
};

describe('ClinicalService', () => {
	it('hides an in-tenant patient from an unassigned nurse', async () => {
		const nurse = harness('NURSE');
		await expect(nurse.service.listVitals(patientId)).rejects.toBeInstanceOf(PatientNotFoundError);
		expect(nurse.vitals.listByPatient).not.toHaveBeenCalled();
	});

	it('lets an assigned nurse list and create vitals but not history', async () => {
		const nurse = harness('NURSE');
		nurse.patients.isAssigned.mockResolvedValue(true);
		const listed = await nurse.service.listVitals(patientId);
		expect(listed.vitals[0]?.synthetic).toBe(true);
		const created = await nurse.service.createVital(patientId, vitalBody);
		expect(created.recordedById).toBe(actorId);
		expect(nurse.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({action: 'vital.created', resourceType: 'vital'}),
		);
		await expect(nurse.service.listHistory(patientId)).rejects.toBeInstanceOf(PermissionDeniedError);
		await expect(nurse.service.createHistory(patientId, historyBody)).rejects.toBeInstanceOf(
			PermissionDeniedError,
		);
		expect(nurse.history.create).not.toHaveBeenCalled();
	});

	it('hides another patient from a portal user and denies portal writes', async () => {
		const patient = harness('PATIENT');
		patient.patients.getById.mockResolvedValue(patientRow({portalUserId: otherId}));
		await expect(patient.service.listHistory(patientId)).rejects.toBeInstanceOf(PatientNotFoundError);

		const own = harness('PATIENT');
		const listed = await own.service.listHistory(patientId);
		expect(listed.history).toHaveLength(1);
		await expect(own.service.createHistory(patientId, historyBody)).rejects.toBeInstanceOf(
			PermissionDeniedError,
		);
	});

	it('denies clinical reads and writes from a receptionist', async () => {
		const receptionist = harness('RECEPTIONIST');
		await expect(receptionist.service.listHistory(patientId)).rejects.toBeInstanceOf(
			PermissionDeniedError,
		);
		await expect(receptionist.service.listVitals(patientId)).rejects.toBeInstanceOf(
			PermissionDeniedError,
		);
		await expect(receptionist.service.createVital(patientId, vitalBody)).rejects.toBeInstanceOf(
			PermissionDeniedError,
		);
	});

	it('creates history for a provider, emits audit, and omits clinical text from the audit payload', async () => {
		const provider = harness('PROVIDER');
		const created = await provider.service.createHistory(patientId, historyBody);
		expect(created.title).toBe('Hypertension follow-up');
		expect(created.synthetic).toBe(true);
		expect(created.providerId).toBe(actorId);
		expect(provider.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'history.created',
				resourceType: 'history',
				resourceId,
				correlationId: 'cid-clinical',
			}),
		);
		expect(JSON.stringify(provider.audit.record.mock.calls[0])).not.toMatch(
			/Hypertension|Blood pressure/,
		);
	});
});
