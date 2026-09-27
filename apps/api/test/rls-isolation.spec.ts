import {randomUUID} from 'node:crypto';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {DataSource} from 'typeorm';
import {Invoice} from '../src/persistence/entities/invoice.entity.js';
import {PatientDocument} from '../src/persistence/entities/patient-document.entity.js';
import {Patient} from '../src/persistence/entities/patient.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {Vital} from '../src/persistence/entities/vital.entity.js';
import {tenantAls} from '../src/tenancy/tenant-als.js';
import {createAdminDataSource, createAppDataSource} from './admin-data-source.js';
import {syntheticPatientColumns} from './synthetic-patient.js';

describe('PostgreSQL row-level security', () => {
	let admin: DataSource;
	let appDataSource: DataSource;
	let practiceA: Practice;
	let practiceB: Practice;
	let userA: User;
	let userB: User;
	let patientA: Patient;
	let patientB: Patient;
	let vitalB: Vital;
	let invoiceB: Invoice;
	let documentB: PatientDocument;

	beforeAll(async () => {
		admin = await createAdminDataSource();
		appDataSource = await createAppDataSource();
		const suffix = randomUUID();
		practiceA = await admin.getRepository(Practice).save({
			name: `RLS Clinic A ${suffix}`,
		});
		practiceB = await admin.getRepository(Practice).save({
			name: `RLS Clinic B ${suffix}`,
		});
		userA = await admin.getRepository(User).save({
			email: `rls.a.${suffix}@synthetic.example`,
		});
		userB = await admin.getRepository(User).save({
			email: `rls.b.${suffix}@synthetic.example`,
		});
		await admin.getRepository(PracticeMembership).save([
			{practiceId: practiceA.id, userId: userA.id, role: 'PROVIDER'},
			{practiceId: practiceB.id, userId: userB.id, role: 'PROVIDER'},
		]);
		patientA = await admin.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(userA.id, {
				firstName: 'Avery',
				lastName: `RlsA${suffix.slice(0, 8)}`,
				email: `rls.avery.${suffix}@synthetic.example`,
			}),
		});
		patientB = await admin.getRepository(Patient).save({
			practiceId: practiceB.id,
			...syntheticPatientColumns(userB.id, {
				firstName: 'Casey',
				lastName: `RlsB${suffix.slice(0, 8)}`,
				email: `rls.casey.${suffix}@synthetic.example`,
			}),
		});
		vitalB = await admin.getRepository(Vital).save({
			practiceId: practiceB.id,
			patientId: patientB.id,
			recordedAt: new Date('2025-07-15T10:15:00.000Z'),
			systolicMmHg: 118,
			diastolicMmHg: 76,
			heartRateBpm: 70,
			temperatureC: 36.6,
			respiratoryRate: 16,
			spo2Percent: 99,
			weightKg: 70.1,
			recordedByUserId: userB.id,
			synthetic: true,
		});
		invoiceB = await admin.getRepository(Invoice).save({
			practiceId: practiceB.id,
			patientId: patientB.id,
			status: 'issued',
			amountCents: 15000,
			currency: 'USD',
			issuedAt: new Date('2025-07-15T10:15:00.000Z'),
			dueAt: new Date('2025-08-14T10:15:00.000Z'),
			synthetic: true,
		});
		documentB = await admin.getRepository(PatientDocument).save({
			practiceId: practiceB.id,
			patientId: patientB.id,
			name: 'Intake summary.pdf',
			contentType: 'application/pdf',
			category: 'intake',
			sizeBytes: 32,
			storageKey: `practices/${practiceB.id}/patients/${patientB.id}/00000000-0000-4000-8000-00000000000d`,
			uploadedByUserId: userB.id,
			synthetic: true,
		});
	});

	afterAll(async () => {
		if (admin?.isInitialized) {
			await admin.getRepository(Vital).delete({practiceId: practiceA.id});
			await admin.getRepository(Vital).delete({practiceId: practiceB.id});
			await admin.getRepository(Invoice).delete({practiceId: practiceA.id});
			await admin.getRepository(Invoice).delete({practiceId: practiceB.id});
			await admin.getRepository(PatientDocument).delete({practiceId: practiceA.id});
			await admin.getRepository(PatientDocument).delete({practiceId: practiceB.id});
			await admin.getRepository(Patient).delete([patientA.id, patientB.id]);
			await admin.getRepository(PracticeMembership).delete({practiceId: practiceA.id});
			await admin.getRepository(PracticeMembership).delete({practiceId: practiceB.id});
			await admin.getRepository(User).delete([userA.id, userB.id]);
			await admin.getRepository(Practice).delete([practiceA.id, practiceB.id]);
			await admin.destroy();
		}
		if (appDataSource?.isInitialized) {
			await appDataSource.destroy();
		}
	});

	it('hides tenant rows and rejects inserts when the GUC is unset', async () => {
		const patients = await appDataSource.query('SELECT id FROM patients');
		const vitals = await appDataSource.query('SELECT id FROM vitals');
		const invoices = await appDataSource.query('SELECT id FROM invoices');
		const documents = await appDataSource.query('SELECT id FROM patient_documents');
		expect(patients.map((row: {id: string}) => row.id)).not.toContain(patientA.id);
		expect(patients.map((row: {id: string}) => row.id)).not.toContain(patientB.id);
		expect(vitals.map((row: {id: string}) => row.id)).not.toContain(vitalB.id);
		expect(invoices.map((row: {id: string}) => row.id)).not.toContain(invoiceB.id);
		expect(documents.map((row: {id: string}) => row.id)).not.toContain(documentB.id);

		await expectRlsWriteFailure({
			practiceId: practiceA.id,
			...syntheticPatientColumns(userA.id, {
				firstName: 'Riley',
				lastName: 'Chen',
				email: `rls.riley.${randomUUID()}@synthetic.example`,
			}),
		});
	});

	it('scopes unscoped selects to the GUC practice', async () => {
		await tenantAls.run({practiceId: practiceA.id}, async () => {
			const patients = await appDataSource.query('SELECT id FROM patients');
			const ids = patients.map((row: {id: string}) => row.id);
			expect(ids).toContain(patientA.id);
			expect(ids).not.toContain(patientB.id);

			const vitals = await appDataSource.query('SELECT id FROM vitals');
			expect(vitals.map((row: {id: string}) => row.id)).not.toContain(vitalB.id);

			const invoices = await appDataSource.query('SELECT id FROM invoices');
			expect(invoices.map((row: {id: string}) => row.id)).not.toContain(invoiceB.id);

			const documents = await appDataSource.query('SELECT id FROM patient_documents');
			expect(documents.map((row: {id: string}) => row.id)).not.toContain(documentB.id);
		});
	});

	it('rejects writes whose practice_id does not match the GUC', async () => {
		await tenantAls.run({practiceId: practiceA.id}, async () => {
			await expectRlsWriteFailure({
				practiceId: practiceB.id,
				...syntheticPatientColumns(userB.id, {
					firstName: 'Injected',
					lastName: 'Cross',
					email: `rls.injected.${randomUUID()}@synthetic.example`,
				}),
			});
		});
	});

	it('allows identity lookup without a tenant GUC', async () => {
		const users = await appDataSource.query('SELECT id FROM users WHERE id = $1', [userA.id]);
		expect(users).toEqual([{id: userA.id}]);
		const memberships = await appDataSource.query(
			'SELECT id FROM practice_memberships WHERE user_id = $1',
			[userA.id],
		);
		expect(memberships.length).toBe(1);
	});

	async function expectRlsWriteFailure(
		input: {practiceId: string} & ReturnType<typeof syntheticPatientColumns>,
	): Promise<void> {
		const runner = appDataSource.createQueryRunner();
		await runner.connect();
		await runner.startTransaction();
		try {
			await expect(runner.manager.getRepository(Patient).save(input)).rejects.toThrow(
				/row-level security/i,
			);
		} finally {
			await runner.rollbackTransaction();
			await runner.release();
		}
	}
});
