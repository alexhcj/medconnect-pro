import {randomUUID} from 'node:crypto';
import {Inject, Injectable} from '@nestjs/common';
import {REQUEST} from '@nestjs/core';
import type {Request} from 'express';
import {AuditEventRepository} from '../audit/audit-event.repository.js';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import {resolvePatientReadScope} from '../patient/patient-access.js';
import {PatientNotFoundError} from '../patient/patient.errors.js';
import type {PatientDocument} from '../persistence/entities/patient-document.entity.js';
import type {Patient} from '../persistence/entities/patient.entity.js';
import {getCorrelationId} from '../platform/correlation.js';
import {PatientRepository} from '../practice/patient.repository.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';
import {canReadDocuments, canUploadDocuments} from './document-access.js';
import {validateUploadedDocument} from './document-file.js';
import {DOCUMENT_OBJECT_STORE, type DocumentObjectStore} from './document-object-store.js';
import {DocumentNotFoundError} from './document.errors.js';
import type {PatientDocumentListRdo, PatientDocumentRdo} from './document.rdo.js';
import type {DocumentUploadFields} from './document.schema.js';
import {PatientDocumentRepository} from './patient-document.repository.js';

export type DocumentDownload = {
	bytes: Buffer;
	contentType: string;
	name: string;
};

@Injectable()
export class DocumentService {
	constructor(
		private readonly documents: PatientDocumentRepository,
		@Inject(DOCUMENT_OBJECT_STORE) private readonly store: DocumentObjectStore,
		private readonly patients: PatientRepository,
		private readonly audit: AuditEventRepository,
		private readonly tenant: TenantContext,
		@Inject(REQUEST) private readonly request: Request,
	) {}

	async list(patientId: string): Promise<PatientDocumentListRdo> {
		await this.assertVisiblePatient(patientId);
		this.assertCanRead();
		const rows = await this.documents.listByPatient(patientId);
		await this.recordAudit('document.listed', patientId);
		return {documents: rows.map(toDocumentRdo)};
	}

	async upload(
		patientId: string,
		fields: DocumentUploadFields,
		file: {buffer: Buffer; originalname?: string} | undefined,
	): Promise<PatientDocumentRdo> {
		this.rejectMultipartPracticeMismatch();
		await this.assertVisiblePatient(patientId);
		this.assertCanUpload();
		const validated = validateUploadedDocument(file);
		const {practiceId, actorUserId} = this.tenant.require();
		const documentId = randomUUID();
		const storageKey = await this.store.put(
			{practiceId, patientId, documentId},
			validated.bytes,
		);
		const row = await this.documents.create({
			id: documentId,
			patientId,
			name: validated.name,
			contentType: validated.contentType,
			category: fields.category,
			sizeBytes: validated.bytes.length,
			storageKey,
			uploadedByUserId: actorUserId,
		});
		await this.recordAudit('document.uploaded', row.id);
		return toDocumentRdo(row);
	}

	async download(patientId: string, documentId: string): Promise<DocumentDownload> {
		await this.assertVisiblePatient(patientId);
		this.assertCanRead();
		const row = await this.documents.getById(patientId, documentId);
		if (!row) {
			throw new DocumentNotFoundError();
		}
		const {practiceId} = this.tenant.require();
		const bytes = await this.store.get(row.storageKey, practiceId);
		await this.recordAudit('document.downloaded', row.id);
		return {bytes, contentType: row.contentType, name: row.name};
	}

	private rejectMultipartPracticeMismatch(): void {
		const {practiceId} = this.tenant.require();
		const body = this.request.body as {practiceId?: unknown} | undefined;
		const clientPracticeId = body?.practiceId;
		if (typeof clientPracticeId === 'string' && clientPracticeId.length > 0 && clientPracticeId !== practiceId) {
			throw new TenantMismatchError();
		}
	}

	private async assertVisiblePatient(patientId: string): Promise<Patient> {
		const scope = this.tenant.require();
		const read = resolvePatientReadScope(scope.role);
		if (read === 'denied') {
			throw new PermissionDeniedError();
		}
		const row = await this.patients.getById(patientId);
		if (!row) {
			throw new PatientNotFoundError();
		}
		if (read.kind === 'assigned' && !(await this.patients.isAssigned(patientId, scope.actorUserId))) {
			throw new PatientNotFoundError();
		}
		if (read.kind === 'own' && row.portalUserId !== scope.actorUserId) {
			throw new PatientNotFoundError();
		}
		return row;
	}

	private assertCanRead(): void {
		const {role} = this.tenant.require();
		if (!canReadDocuments(role)) {
			throw new PermissionDeniedError();
		}
	}

	private assertCanUpload(): void {
		const {role} = this.tenant.require();
		if (!canUploadDocuments(role)) {
			throw new PermissionDeniedError();
		}
	}

	private async recordAudit(action: string, resourceId: string): Promise<void> {
		await this.audit.record({
			action,
			resourceType: 'document',
			resourceId,
			correlationId: getCorrelationId(this.request),
		});
	}
}

export function toDocumentRdo(row: PatientDocument): PatientDocumentRdo {
	return {
		id: row.id,
		patientId: row.patientId,
		name: row.name,
		contentType: row.contentType,
		category: row.category,
		sizeBytes: row.sizeBytes,
		uploadedAt: row.createdAt.toISOString(),
		uploadedById: row.uploadedByUserId,
		synthetic: row.synthetic,
	};
}
