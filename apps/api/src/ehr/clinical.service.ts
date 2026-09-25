import {Inject, Injectable} from '@nestjs/common';
import {REQUEST} from '@nestjs/core';
import type {Request} from 'express';
import {AuditEventRepository} from '../audit/audit-event.repository.js';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import {resolvePatientReadScope} from '../patient/patient-access.js';
import {PatientNotFoundError} from '../patient/patient.errors.js';
import type {ClinicalCondition} from '../persistence/entities/clinical-condition.entity.js';
import type {ClinicalHistory} from '../persistence/entities/clinical-history.entity.js';
import type {Medication} from '../persistence/entities/medication.entity.js';
import type {Patient} from '../persistence/entities/patient.entity.js';
import type {Vital} from '../persistence/entities/vital.entity.js';
import {getCorrelationId} from '../platform/correlation.js';
import {PatientRepository} from '../practice/patient.repository.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {
	canReadClinical,
	canWriteClinical,
	type ClinicalResourceKind,
} from './clinical-access.js';
import {ClinicalConditionRepository} from './clinical-condition.repository.js';
import {ClinicalHistoryRepository} from './clinical-history.repository.js';
import type {
	ConditionCreateBody,
	HistoryCreateBody,
	MedicationCreateBody,
	VitalCreateBody,
} from './clinical.schema.js';
import type {
	ClinicalConditionRdo,
	ConditionListRdo,
	HistoryEntryRdo,
	HistoryListRdo,
	MedicationListRdo,
	MedicationRdo,
	VitalListRdo,
	VitalRdo,
} from './clinical.rdo.js';
import {MedicationRepository} from './medication.repository.js';
import {VitalRepository} from './vital.repository.js';

@Injectable()
export class ClinicalService {
	constructor(
		private readonly history: ClinicalHistoryRepository,
		private readonly conditions: ClinicalConditionRepository,
		private readonly vitals: VitalRepository,
		private readonly medications: MedicationRepository,
		private readonly patients: PatientRepository,
		private readonly audit: AuditEventRepository,
		private readonly tenant: TenantContext,
		@Inject(REQUEST) private readonly request: Request,
	) {}

	async listHistory(patientId: string): Promise<HistoryListRdo> {
		await this.assertVisiblePatient(patientId);
		this.assertCanRead('history');
		const rows = await this.history.listByPatient(patientId);
		return {history: rows.map(toHistoryRdo)};
	}

	async createHistory(patientId: string, input: HistoryCreateBody): Promise<HistoryEntryRdo> {
		await this.assertVisiblePatient(patientId);
		this.assertCanWrite('history');
		const {actorUserId} = this.tenant.require();
		const row = await this.history.create({
			patientId,
			type: input.type,
			occurredAt: new Date(input.occurredAt),
			title: input.title,
			summary: input.summary,
			providerUserId: actorUserId,
			status: input.status,
		});
		await this.recordAudit('history.created', 'history', row.id);
		return toHistoryRdo(row);
	}

	async listConditions(patientId: string): Promise<ConditionListRdo> {
		await this.assertVisiblePatient(patientId);
		this.assertCanRead('conditions');
		const rows = await this.conditions.listByPatient(patientId);
		return {conditions: rows.map(toConditionRdo)};
	}

	async createCondition(patientId: string, input: ConditionCreateBody): Promise<ClinicalConditionRdo> {
		await this.assertVisiblePatient(patientId);
		this.assertCanWrite('conditions');
		const {actorUserId} = this.tenant.require();
		const row = await this.conditions.create({
			patientId,
			display: input.display,
			clinicalStatus: input.clinicalStatus,
			recordedAt: new Date(input.recordedAt),
			recordedByUserId: actorUserId,
		});
		await this.recordAudit('condition.created', 'condition', row.id);
		return toConditionRdo(row);
	}

	async listVitals(patientId: string): Promise<VitalListRdo> {
		await this.assertVisiblePatient(patientId);
		this.assertCanRead('vitals');
		const rows = await this.vitals.listByPatient(patientId);
		return {vitals: rows.map(toVitalRdo)};
	}

	async createVital(patientId: string, input: VitalCreateBody): Promise<VitalRdo> {
		await this.assertVisiblePatient(patientId);
		this.assertCanWrite('vitals');
		const {actorUserId} = this.tenant.require();
		const row = await this.vitals.create({
			patientId,
			recordedAt: new Date(input.recordedAt),
			systolicMmHg: input.systolicMmHg,
			diastolicMmHg: input.diastolicMmHg,
			heartRateBpm: input.heartRateBpm,
			temperatureC: input.temperatureC,
			respiratoryRate: input.respiratoryRate,
			spo2Percent: input.spo2Percent,
			weightKg: input.weightKg,
			recordedByUserId: actorUserId,
		});
		await this.recordAudit('vital.created', 'vital', row.id);
		return toVitalRdo(row);
	}

	async listMedications(patientId: string): Promise<MedicationListRdo> {
		await this.assertVisiblePatient(patientId);
		this.assertCanRead('medications');
		const rows = await this.medications.listByPatient(patientId);
		return {medications: rows.map(toMedicationRdo)};
	}

	async createMedication(patientId: string, input: MedicationCreateBody): Promise<MedicationRdo> {
		await this.assertVisiblePatient(patientId);
		this.assertCanWrite('medications');
		const {actorUserId} = this.tenant.require();
		const row = await this.medications.create({
			patientId,
			name: input.name,
			dosage: input.dosage,
			frequency: input.frequency,
			route: input.route,
			startDate: input.startDate,
			endDate: input.endDate,
			prescriberUserId: actorUserId,
			instructions: input.instructions,
			status: input.status,
		});
		await this.recordAudit('medication.created', 'medication', row.id);
		return toMedicationRdo(row);
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

	private assertCanRead(resource: ClinicalResourceKind): void {
		const {role} = this.tenant.require();
		if (!canReadClinical(role, resource)) {
			throw new PermissionDeniedError();
		}
	}

	private assertCanWrite(resource: ClinicalResourceKind): void {
		const {role} = this.tenant.require();
		if (!canWriteClinical(role, resource)) {
			throw new PermissionDeniedError();
		}
	}

	private async recordAudit(action: string, resourceType: string, resourceId: string): Promise<void> {
		await this.audit.record({
			action,
			resourceType,
			resourceId,
			correlationId: getCorrelationId(this.request),
		});
	}
}

export function toHistoryRdo(row: ClinicalHistory): HistoryEntryRdo {
	return {
		id: row.id,
		practiceId: row.practiceId,
		patientId: row.patientId,
		type: row.type,
		occurredAt: row.occurredAt.toISOString(),
		title: row.title,
		summary: row.summary,
		providerId: row.providerUserId,
		status: row.status,
		synthetic: row.synthetic,
	};
}

export function toConditionRdo(row: ClinicalCondition): ClinicalConditionRdo {
	return {
		id: row.id,
		practiceId: row.practiceId,
		patientId: row.patientId,
		display: row.display,
		clinicalStatus: row.clinicalStatus,
		recordedAt: row.recordedAt.toISOString(),
		recordedById: row.recordedByUserId,
		synthetic: row.synthetic,
	};
}

export function toVitalRdo(row: Vital): VitalRdo {
	return {
		id: row.id,
		practiceId: row.practiceId,
		patientId: row.patientId,
		recordedAt: row.recordedAt.toISOString(),
		systolicMmHg: row.systolicMmHg,
		diastolicMmHg: row.diastolicMmHg,
		heartRateBpm: row.heartRateBpm,
		temperatureC: row.temperatureC,
		respiratoryRate: row.respiratoryRate,
		spo2Percent: row.spo2Percent,
		weightKg: row.weightKg,
		recordedById: row.recordedByUserId,
		synthetic: row.synthetic,
	};
}

export function toMedicationRdo(row: Medication): MedicationRdo {
	const rdo: MedicationRdo = {
		id: row.id,
		practiceId: row.practiceId,
		patientId: row.patientId,
		name: row.name,
		dosage: row.dosage,
		frequency: row.frequency,
		route: row.route,
		startDate: row.startDate,
		prescriberId: row.prescriberUserId,
		instructions: row.instructions,
		status: row.status,
		synthetic: row.synthetic,
	};
	if (row.endDate) {
		rdo.endDate = row.endDate;
	}
	return rdo;
}
