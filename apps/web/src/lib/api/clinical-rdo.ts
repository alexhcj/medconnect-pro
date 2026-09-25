import type {ClinicalCondition} from '@/types/medical/clinical-condition';
import type {HistoryEntry} from '@/types/medical/history';
import type {Medication} from '@/types/medical/medication';
import type {Vital} from '@/types/medical/vital';

/** History row returned by Nest `HistoryEntryRdo`. `practiceId` is informational only. */
export interface HistoryEntryRdo {
	id: string;
	practiceId: string;
	patientId: string;
	type: HistoryEntry['type'];
	occurredAt: string;
	title: string;
	summary: string;
	providerId: string;
	status: HistoryEntry['status'];
	synthetic: boolean;
}

export interface HistoryListRdo {
	history: HistoryEntryRdo[];
}

/** Condition row returned by Nest `ClinicalConditionRdo`. `practiceId` is informational only. */
export interface ClinicalConditionRdo {
	id: string;
	practiceId: string;
	patientId: string;
	display: string;
	clinicalStatus: ClinicalCondition['clinicalStatus'];
	recordedAt: string;
	recordedById: string;
	synthetic: boolean;
}

export interface ConditionListRdo {
	conditions: ClinicalConditionRdo[];
}

/** Vital row returned by Nest `VitalRdo`. `practiceId` is informational only. */
export interface VitalRdo {
	id: string;
	practiceId: string;
	patientId: string;
	recordedAt: string;
	systolicMmHg: number;
	diastolicMmHg: number;
	heartRateBpm: number;
	temperatureC: number;
	respiratoryRate: number;
	spo2Percent: number;
	weightKg: number;
	recordedById: string;
	synthetic: boolean;
}

export interface VitalListRdo {
	vitals: VitalRdo[];
}

/** Medication row returned by Nest `MedicationRdo`. `practiceId` is informational only. */
export interface MedicationRdo {
	id: string;
	practiceId: string;
	patientId: string;
	name: string;
	dosage: string;
	frequency: string;
	route: string;
	startDate: string;
	endDate?: string;
	prescriberId: string;
	instructions: string;
	status: Medication['status'];
	synthetic: boolean;
}

export interface MedicationListRdo {
	medications: MedicationRdo[];
}

export function historyFromRdo(rdo: HistoryEntryRdo): HistoryEntry {
	return {
		id: rdo.id,
		patientId: rdo.patientId,
		type: rdo.type,
		occurredAt: rdo.occurredAt,
		title: rdo.title,
		summary: rdo.summary,
		providerId: rdo.providerId,
		status: rdo.status,
		synthetic: rdo.synthetic,
	};
}

export function conditionFromRdo(rdo: ClinicalConditionRdo): ClinicalCondition {
	return {
		id: rdo.id,
		patientId: rdo.patientId,
		display: rdo.display,
		clinicalStatus: rdo.clinicalStatus,
		recordedAt: rdo.recordedAt,
		recordedById: rdo.recordedById,
		synthetic: rdo.synthetic,
	};
}

export function vitalFromRdo(rdo: VitalRdo): Vital {
	return {
		id: rdo.id,
		patientId: rdo.patientId,
		recordedAt: rdo.recordedAt,
		systolicMmHg: rdo.systolicMmHg,
		diastolicMmHg: rdo.diastolicMmHg,
		heartRateBpm: rdo.heartRateBpm,
		temperatureC: rdo.temperatureC,
		respiratoryRate: rdo.respiratoryRate,
		spo2Percent: rdo.spo2Percent,
		weightKg: rdo.weightKg,
		recordedById: rdo.recordedById,
		synthetic: rdo.synthetic,
	};
}

export function medicationFromRdo(rdo: MedicationRdo): Medication {
	const medication: Medication = {
		id: rdo.id,
		patientId: rdo.patientId,
		name: rdo.name,
		dosage: rdo.dosage,
		frequency: rdo.frequency,
		route: rdo.route,
		startDate: rdo.startDate,
		prescriberId: rdo.prescriberId,
		instructions: rdo.instructions,
		status: rdo.status,
		synthetic: rdo.synthetic,
	};
	if (rdo.endDate) {
		medication.endDate = rdo.endDate;
	}
	return medication;
}
