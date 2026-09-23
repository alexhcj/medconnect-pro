import {randomUUID} from 'node:crypto';
import {beforeAll, afterAll, describe, expect, it} from 'vitest';
import {DataSource} from 'typeorm';
import {DEFAULT_DATABASE_URL} from '../src/persistence/default-database-url.js';
import {PatientAssignment} from '../src/persistence/entities/patient-assignment.entity.js';
import {Patient} from '../src/persistence/entities/patient.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {postgresConnectionOptions} from '../src/persistence/typeorm.options.js';
import {MembershipRepository} from '../src/practice/membership.repository.js';
import {PatientRepository} from '../src/practice/patient.repository.js';
import {PracticeRepository} from '../src/practice/practice.repository.js';
import {TenantContext} from '../src/tenancy/tenant-context.js';
import {TenantMismatchError, TenantScopeMissingError} from '../src/tenancy/tenant-errors.js';
import {syntheticDemographics, syntheticPatientColumns} from './synthetic-patient.js';

const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

describe('tenant isolation', () => {
	let dataSource: DataSource;
	let practiceA: Practice;
	let practiceB: Practice;
	let userA: User;
	let userB: User;
	let patientA: Patient;
	let patientB: Patient;
	let membershipB: PracticeMembership;

	beforeAll(async () => {
		dataSource = new DataSource(postgresConnectionOptions(databaseUrl));
		try {
			await dataSource.initialize();
		} catch (error) {
			throw new Error(
				`PostgreSQL is required for API tests. Start it with docker compose up -d. DATABASE_URL=${databaseUrl}`,
				{cause: error},
			);
		}
		await dataSource.runMigrations();

		const suffix = randomUUID();
		practiceA = await dataSource.getRepository(Practice).save({
			name: `Riverside Synthetic Clinic ${suffix}`,
		});
		practiceB = await dataSource.getRepository(Practice).save({
			name: `Lakeside Synthetic Clinic ${suffix}`,
		});
		userA = await dataSource.getRepository(User).save({
			email: `jordan.lee.${suffix}@synthetic.example`,
		});
		userB = await dataSource.getRepository(User).save({
			email: `morgan.patel.${suffix}@synthetic.example`,
		});
		await dataSource.getRepository(PracticeMembership).save({
			practiceId: practiceA.id,
			userId: userA.id,
			role: 'PROVIDER',
		});
		membershipB = await dataSource.getRepository(PracticeMembership).save({
			practiceId: practiceB.id,
			userId: userB.id,
			role: 'NURSE',
		});
		patientA = await dataSource.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(userA.id),
		});
		patientB = await dataSource.getRepository(Patient).save({
			practiceId: practiceB.id,
			...syntheticPatientColumns(userB.id, {
				firstName: 'Casey',
				lastName: 'Ramirez',
				email: 'casey.ramirez@synthetic.example',
			}),
		});
	});

	afterAll(async () => {
		if (!dataSource?.isInitialized) {
			return;
		}
		await dataSource.getRepository(PatientAssignment).delete({practiceId: practiceA.id});
		await dataSource.getRepository(PatientAssignment).delete({practiceId: practiceB.id});
		await dataSource.getRepository(Patient).delete([patientA.id, patientB.id]);
		await dataSource.getRepository(PracticeMembership).delete({practiceId: practiceA.id});
		await dataSource.getRepository(PracticeMembership).delete({practiceId: practiceB.id});
		await dataSource.getRepository(User).delete([userA.id, userB.id]);
		await dataSource.getRepository(Practice).delete([practiceA.id, practiceB.id]);
		await dataSource.destroy();
	});

	function scopedPatientRepo(practiceId: string, actorUserId: string): PatientRepository {
		const tenant = new TenantContext();
		tenant.set({practiceId, actorUserId, role: 'PROVIDER'});
		return new PatientRepository(
			dataSource.getRepository(Patient),
			dataSource.getRepository(PatientAssignment),
			tenant,
		);
	}

	function scopedMembershipRepo(practiceId: string, actorUserId: string): MembershipRepository {
		const tenant = new TenantContext();
		tenant.set({practiceId, actorUserId, role: 'PRACTICE_ADMIN'});
		return new MembershipRepository(dataSource.getRepository(PracticeMembership), tenant);
	}

	it('lists only patients in the server-resolved practice', async () => {
		const listed = await scopedPatientRepo(practiceA.id, userA.id).list();
		const ids = listed.map((row) => row.id);
		expect(ids).toContain(patientA.id);
		expect(ids).not.toContain(patientB.id);
	});

	it('does not reveal a cross-tenant patient id', async () => {
		const found = await scopedPatientRepo(practiceA.id, userA.id).getById(patientB.id);
		expect(found).toBeUndefined();
	});

	it('rejects writes that carry a mismatched client practice id', async () => {
		await expect(
			scopedPatientRepo(practiceA.id, userA.id).create({
				...syntheticDemographics(userA.id, {firstName: 'Riley', lastName: 'Chen'}),
				practiceId: practiceB.id,
			}),
		).rejects.toBeInstanceOf(TenantMismatchError);
	});

	it('does not update a cross-tenant patient', async () => {
		const updated = await scopedPatientRepo(practiceA.id, userA.id).update(patientB.id, {
			firstName: 'Injected',
		});
		expect(updated).toBeUndefined();
		const unchanged = await dataSource.getRepository(Patient).findOneByOrFail({id: patientB.id});
		expect(unchanged.firstName).toBe('Casey');
	});

	it('fails closed when tenant scope is missing', async () => {
		const tenant = new TenantContext();
		const patients = new PatientRepository(
			dataSource.getRepository(Patient),
			dataSource.getRepository(PatientAssignment),
			tenant,
		);
		await expect(patients.list()).rejects.toBeInstanceOf(TenantScopeMissingError);
	});

	it('scopes memberships to the current practice', async () => {
		const listed = await scopedMembershipRepo(practiceA.id, userA.id).list();
		const ids = listed.map((row) => row.id);
		expect(ids).not.toContain(membershipB.id);
		expect(listed.every((row) => row.practiceId === practiceA.id)).toBe(true);
	});

	it('resolves the current practice only from tenant context', async () => {
		const tenant = new TenantContext();
		tenant.set({practiceId: practiceA.id, actorUserId: userA.id, role: 'PROVIDER'});
		const practices = new PracticeRepository(dataSource.getRepository(Practice), tenant);
		const current = await practices.getCurrent();
		expect(current?.id).toBe(practiceA.id);
		expect(current?.name).not.toBe(practiceB.name);
	});
});
