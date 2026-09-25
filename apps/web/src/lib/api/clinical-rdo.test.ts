import {describe, expect, it} from 'vitest';
import {
	conditionFromRdo,
	historyFromRdo,
	medicationFromRdo,
	vitalFromRdo,
	type ClinicalConditionRdo,
	type HistoryEntryRdo,
	type MedicationRdo,
	type VitalRdo,
} from '@/lib/api/clinical-rdo';

const practiceId = '22222222-2222-4222-8222-222222222222';
const patientId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const providerId = '11111111-1111-4111-8111-111111111111';

const historyRdo: HistoryEntryRdo = {
	id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
	practiceId,
	patientId,
	type: 'visit',
	occurredAt: '2025-07-15T10:30:00.000Z',
	title: 'Hypertension follow-up',
	summary: 'Blood pressure stable on current medication. Continue current plan.',
	providerId,
	status: 'completed',
	synthetic: true,
};

const conditionRdo: ClinicalConditionRdo = {
	id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
	practiceId,
	patientId,
	display: 'Hypertension',
	clinicalStatus: 'active',
	recordedAt: '2025-07-15T10:30:00.000Z',
	recordedById: providerId,
	synthetic: true,
};

const vitalRdo: VitalRdo = {
	id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
	practiceId,
	patientId,
	recordedAt: '2025-07-15T10:15:00.000Z',
	systolicMmHg: 128,
	diastolicMmHg: 82,
	heartRateBpm: 72,
	temperatureC: 36.7,
	respiratoryRate: 16,
	spo2Percent: 98,
	weightKg: 72.5,
	recordedById: providerId,
	synthetic: true,
};

const medicationRdo: MedicationRdo = {
	id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
	practiceId,
	patientId,
	name: 'Lisinopril',
	dosage: '10mg',
	frequency: 'Once daily',
	route: 'oral',
	startDate: '2023-01-10',
	prescriberId: providerId,
	instructions: 'Take in the morning with water',
	status: 'active',
	synthetic: true,
};

describe('clinical RDO mappers', () => {
	it('maps history, conditions, vitals, and medications without practiceId', () => {
		expect(historyFromRdo(historyRdo)).toEqual({
			id: historyRdo.id,
			patientId,
			type: 'visit',
			occurredAt: historyRdo.occurredAt,
			title: historyRdo.title,
			summary: historyRdo.summary,
			providerId,
			status: 'completed',
			synthetic: true,
		});
		expect(conditionFromRdo(conditionRdo)).toEqual({
			id: conditionRdo.id,
			patientId,
			display: 'Hypertension',
			clinicalStatus: 'active',
			recordedAt: conditionRdo.recordedAt,
			recordedById: providerId,
			synthetic: true,
		});
		expect(vitalFromRdo(vitalRdo)).toEqual({
			id: vitalRdo.id,
			patientId,
			recordedAt: vitalRdo.recordedAt,
			systolicMmHg: 128,
			diastolicMmHg: 82,
			heartRateBpm: 72,
			temperatureC: 36.7,
			respiratoryRate: 16,
			spo2Percent: 98,
			weightKg: 72.5,
			recordedById: providerId,
			synthetic: true,
		});
		expect(medicationFromRdo(medicationRdo)).toEqual({
			id: medicationRdo.id,
			patientId,
			name: 'Lisinopril',
			dosage: '10mg',
			frequency: 'Once daily',
			route: 'oral',
			startDate: '2023-01-10',
			prescriberId: providerId,
			instructions: 'Take in the morning with water',
			status: 'active',
			synthetic: true,
		});
		expect(historyFromRdo(historyRdo)).not.toHaveProperty('practiceId');
		expect(conditionFromRdo(conditionRdo)).not.toHaveProperty('practiceId');
		expect(vitalFromRdo(vitalRdo)).not.toHaveProperty('practiceId');
		expect(medicationFromRdo(medicationRdo)).not.toHaveProperty('practiceId');
	});

	it('copies medication endDate when Nest provides it', () => {
		expect(medicationFromRdo({...medicationRdo, endDate: '2026-01-10'}).endDate).toBe('2026-01-10');
	});
});
