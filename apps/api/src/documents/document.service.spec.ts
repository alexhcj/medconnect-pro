import {describe, expect, it, vi} from 'vitest';
import type {AuditEventRepository} from '../audit/audit-event.repository.js';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import {PatientNotFoundError} from '../patient/patient.errors.js';
import type {PatientDocument} from '../persistence/entities/patient-document.entity.js';
import type {Patient} from '../persistence/entities/patient.entity.js';
import type {PatientRepository} from '../practice/patient.repository.js';
import type {PracticeRole} from '../tenancy/practice-role.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import type {DocumentObjectStore} from './document-object-store.js';
import {syntheticPdfBytes} from './document-file.js';
import {DocumentNotFoundError} from './document.errors.js';
import {DocumentService} from './document.service.js';
import type {PatientDocumentRepository} from './patient-document.repository.js';

const actorId = '00000000-0000-4000-8000-000000000010';
const otherId = '00000000-0000-4000-8000-000000000011';
const patientId = '00000000-0000-4000-8000-0000000000aa';
const practiceId = '00000000-0000-4000-8000-000000000001';
const resourceId = '00000000-0000-4000-8000-0000000000cc';
const pdf = syntheticPdfBytes();

function patientRow(overrides: Partial<Patient> = {}): Patient {
	return {
		id: patientId,
		practiceId,
		portalUserId: actorId,
		...overrides,
	} as Patient;
}

function documentRow(): PatientDocument {
	return {
		id: resourceId,
		practiceId,
		patientId,
		name: 'Intake summary.pdf',
		contentType: 'application/pdf',
		category: 'intake',
		sizeBytes: pdf.length,
		storageKey: `practices/${practiceId}/patients/${patientId}/${resourceId}`,
		uploadedByUserId: actorId,
		synthetic: true,
		createdAt: new Date('2025-07-15T10:40:00.000Z'),
	} as PatientDocument;
}

function harness(role: PracticeRole, userId = actorId) {
	const tenant = new TenantContext();
	tenant.set({practiceId, actorUserId: userId, role});
	const documents = {
		listByPatient: vi.fn().mockResolvedValue([documentRow()]),
		getById: vi.fn().mockResolvedValue(documentRow()),
		create: vi.fn().mockResolvedValue(documentRow()),
	};
	const store = {
		put: vi.fn().mockResolvedValue(`practices/${practiceId}/patients/${patientId}/${resourceId}`),
		get: vi.fn().mockResolvedValue(pdf),
	};
	const patients = {
		getById: vi.fn().mockResolvedValue(patientRow()),
		isAssigned: vi.fn().mockResolvedValue(false),
	};
	const audit = {
		record: vi.fn().mockResolvedValue({}),
	};
	const request = {correlationId: 'cid-document'} as never;
	const service = new DocumentService(
		documents as unknown as PatientDocumentRepository,
		store as unknown as DocumentObjectStore,
		patients as unknown as PatientRepository,
		audit as unknown as AuditEventRepository,
		tenant,
		request,
	);
	return {service, documents, store, patients, audit};
}

describe('DocumentService', () => {
	it('hides an in-tenant patient from an unassigned nurse', async () => {
		const nurse = harness('NURSE');
		await expect(nurse.service.list(patientId)).rejects.toBeInstanceOf(PatientNotFoundError);
		expect(nurse.documents.listByPatient).not.toHaveBeenCalled();
	});

	it('denies list and upload from a receptionist even when the patient is visible', async () => {
		const receptionist = harness('RECEPTIONIST');
		await expect(receptionist.service.list(patientId)).rejects.toBeInstanceOf(PermissionDeniedError);
		await expect(
			receptionist.service.upload(patientId, {category: 'intake'}, {
				buffer: pdf,
				originalname: 'intake.pdf',
			}),
		).rejects.toBeInstanceOf(PermissionDeniedError);
		expect(receptionist.store.put).not.toHaveBeenCalled();
	});

	it('hides another patient from a portal user and denies portal uploads', async () => {
		const other = harness('PATIENT');
		other.patients.getById.mockResolvedValue(patientRow({portalUserId: otherId}));
		await expect(other.service.list(patientId)).rejects.toBeInstanceOf(PatientNotFoundError);

		const own = harness('PATIENT');
		const listed = await own.service.list(patientId);
		expect(listed.documents).toHaveLength(1);
		await expect(
			own.service.upload(patientId, {category: 'intake'}, {buffer: pdf, originalname: 'intake.pdf'}),
		).rejects.toBeInstanceOf(PermissionDeniedError);
	});

	it('uploads for a provider, stores tenant-prefixed bytes, and audits without filenames', async () => {
		const provider = harness('PROVIDER');
		const created = await provider.service.upload(
			patientId,
			{category: 'intake'},
			{buffer: pdf, originalname: 'Intake summary.pdf'},
		);
		expect(created.synthetic).toBe(true);
		expect(created.name).toBe('Intake summary.pdf');
		expect(provider.store.put).toHaveBeenCalledWith(
			expect.objectContaining({practiceId, patientId}),
			pdf,
		);
		expect(provider.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'document.uploaded',
				resourceType: 'document',
				correlationId: 'cid-document',
			}),
		);
		expect(JSON.stringify(provider.audit.record.mock.calls[0])).not.toMatch(/Intake summary/);
	});

	it('downloads authorized bytes and 404s unknown documents', async () => {
		const provider = harness('PROVIDER');
		const downloaded = await provider.service.download(patientId, resourceId);
		expect(downloaded.bytes.equals(pdf)).toBe(true);
		expect(provider.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({action: 'document.downloaded', resourceId}),
		);

		provider.documents.getById.mockResolvedValue(null);
		await expect(provider.service.download(patientId, resourceId)).rejects.toBeInstanceOf(
			DocumentNotFoundError,
		);
	});
});
