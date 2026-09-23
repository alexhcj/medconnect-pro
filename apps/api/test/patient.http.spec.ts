import {randomUUID} from 'node:crypto';
import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {DataSource, In} from 'typeorm';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {MOCK_IDP_USERS, type MockIdpAccount} from '../src/identity/mock-idp.js';
import {configureApp} from '../src/platform/configure-app.js';
import {AuthSession} from '../src/persistence/entities/auth-session.entity.js';
import {PatientAssignment} from '../src/persistence/entities/patient-assignment.entity.js';
import {Patient} from '../src/persistence/entities/patient.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import type {PatientDemographics} from '../src/practice/patient.repository.js';
import {syntheticDemographics, syntheticPatientColumns} from './synthetic-patient.js';

const password = 'Synthetic-Pass-1';

function patientBody(providerId: string, overrides: Partial<PatientDemographics> = {}) {
	const demographics = syntheticDemographics(providerId, overrides);
	return {
		firstName: demographics.firstName,
		lastName: demographics.lastName,
		dateOfBirth: demographics.dateOfBirth,
		gender: demographics.gender,
		status: demographics.status,
		phone: demographics.phone,
		email: demographics.email,
		address: {
			street: demographics.street,
			city: demographics.city,
			state: demographics.state,
			postalCode: demographics.postalCode,
		},
		emergencyContact: {
			name: demographics.emergencyContactName,
			relationship: demographics.emergencyContactRelationship,
			phone: demographics.emergencyContactPhone,
		},
		insurance: {
			provider: demographics.insuranceProvider,
			policyNumber: demographics.insurancePolicyNumber,
			groupNumber: demographics.insuranceGroupNumber,
		},
		providerId: demographics.providerId,
	};
}

describe('patient HTTP', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let practiceA: Practice;
	let practiceB: Practice;
	let receptionist: User;
	let provider: User;
	let nurse: User;
	let portalUser: User;
	let foreignPatient: Patient;
	const suffix = randomUUID().slice(0, 8);

	beforeAll(async () => {
		const receptionistEmail = `receptionist.${suffix}@synthetic.example`;
		const providerEmail = `provider.${suffix}@synthetic.example`;
		const nurseEmail = `nurse.${suffix}@synthetic.example`;
		const portalEmail = `portal.${suffix}@synthetic.example`;
		const catalog: MockIdpAccount[] = [
			{email: receptionistEmail, password, role: 'RECEPTIONIST'},
			{email: providerEmail, password, role: 'PROVIDER'},
			{email: nurseEmail, password, role: 'NURSE'},
			{email: portalEmail, password, role: 'PATIENT'},
		];

		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(MOCK_IDP_USERS)
			.useValue(catalog)
			.compile();

		app = moduleRef.createNestApplication();
		configureApp(app);
		await app.init();
		dataSource = app.get(DataSource);
		await dataSource.runMigrations();

		practiceA = await dataSource.getRepository(Practice).save({
			name: `North Synthetic ${suffix}`,
		});
		practiceB = await dataSource.getRepository(Practice).save({
			name: `South Synthetic ${suffix}`,
		});
		receptionist = await dataSource.getRepository(User).save({email: receptionistEmail});
		provider = await dataSource.getRepository(User).save({email: providerEmail});
		nurse = await dataSource.getRepository(User).save({email: nurseEmail});
		portalUser = await dataSource.getRepository(User).save({email: portalEmail});
		const outsider = await dataSource.getRepository(User).save({
			email: `outsider.${suffix}@synthetic.example`,
		});
		await dataSource.getRepository(PracticeMembership).save([
			{practiceId: practiceA.id, userId: receptionist.id, role: 'RECEPTIONIST'},
			{practiceId: practiceA.id, userId: provider.id, role: 'PROVIDER'},
			{practiceId: practiceA.id, userId: nurse.id, role: 'NURSE'},
			{practiceId: practiceA.id, userId: portalUser.id, role: 'PATIENT'},
			{practiceId: practiceB.id, userId: outsider.id, role: 'PROVIDER'},
		]);
		foreignPatient = await dataSource.getRepository(Patient).save({
			practiceId: practiceB.id,
			...syntheticPatientColumns(outsider.id, {
				firstName: 'Casey',
				lastName: `Foreign${suffix}`,
				email: `foreign.${suffix}@synthetic.example`,
			}),
		});
	});

	afterAll(async () => {
		if (!dataSource?.isInitialized) {
			await app?.close();
			return;
		}
		const practiceIds = [practiceA, practiceB].filter(Boolean).map((practice) => practice.id);
		const users = await dataSource.getRepository(User).find({
			where: [
				{email: receptionist?.email},
				{email: provider?.email},
				{email: nurse?.email},
				{email: portalUser?.email},
				{email: `outsider.${suffix}@synthetic.example`},
			],
		});
		const userIds = users.map((user) => user.id);
		if (userIds.length > 0) {
			await dataSource.getRepository(AuthSession).delete({userId: In(userIds)});
		}
		if (practiceIds.length > 0) {
			await dataSource.getRepository(PatientAssignment).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(Patient).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(PracticeMembership).delete({practiceId: In(practiceIds)});
		}
		if (userIds.length > 0) {
			await dataSource.getRepository(User).delete({id: In(userIds)});
		}
		if (practiceIds.length > 0) {
			await dataSource.getRepository(Practice).delete({id: In(practiceIds)});
		}
		await app?.close();
	});

	async function login(email: string): Promise<string> {
		const response = await request(app.getHttpServer())
			.post('/auth/login')
			.send({email, password})
			.expect(200);
		return response.body.accessToken as string;
	}

	it('rejects anonymous access and invalid demographics', async () => {
		const anonymous = await request(app.getHttpServer()).get('/patients').expect(401);
		expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');

		const token = await login(receptionist.email);
		const invalid = await request(app.getHttpServer())
			.post('/patients')
			.set('Authorization', `Bearer ${token}`)
			.send({firstName: ''})
			.expect(400);
		expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
		expect(invalid.body.error.details.length).toBeGreaterThan(0);
		expect(JSON.stringify(invalid.body)).not.toMatch(/stack|password/i);
	});

	it('creates, filters, and updates a patient for a receptionist', async () => {
		const token = await login(receptionist.email);
		const created = await request(app.getHttpServer())
			.post('/patients')
			.set('Authorization', `Bearer ${token}`)
			.send(
				patientBody(provider.id, {
					firstName: 'Avery',
					lastName: `Quinn${suffix}`,
					email: `avery.${suffix}@synthetic.example`,
				}),
			)
			.expect(201);
		expect(created.body.synthetic).toBe(true);
		expect(created.body.practiceId).toBe(practiceA.id);
		expect(created.body.providerId).toBe(provider.id);
		expect(created.body).not.toHaveProperty('conditions');

		const profile = await request(app.getHttpServer())
			.get(`/patients/${created.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(profile.body.id).toBe(created.body.id);
		expect(profile.body.practiceId).toBe(practiceA.id);
		expect(profile.body.synthetic).toBe(true);
		expect(profile.body).not.toHaveProperty('conditions');

		const listed = await request(app.getHttpServer())
			.get('/patients')
			.query({q: `Quinn${suffix}`, status: 'active', sort: 'name-asc'})
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(listed.body.patients.map((row: {id: string}) => row.id)).toContain(created.body.id);
		expect(listed.body.hasMore).toBe(false);

		const updated = await request(app.getHttpServer())
			.patch(`/patients/${created.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send({phone: '555-0177', status: 'inactive'})
			.expect(200);
		expect(updated.body.phone).toBe('555-0177');
		expect(updated.body.status).toBe('inactive');

		const inactive = await request(app.getHttpServer())
			.get('/patients')
			.query({q: `Quinn${suffix}`, status: 'inactive'})
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(inactive.body.patients).toHaveLength(1);

		const active = await request(app.getHttpServer())
			.get('/patients')
			.query({q: `Quinn${suffix}`, status: 'active'})
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(active.body.patients).toHaveLength(0);
	});

	it('denies writes from a provider and a provider outside the practice', async () => {
		const providerToken = await login(provider.email);
		const denied = await request(app.getHttpServer())
			.post('/patients')
			.set('Authorization', `Bearer ${providerToken}`)
			.send(patientBody(provider.id, {email: `denied.${suffix}@synthetic.example`}))
			.expect(403);
		expect(denied.body.error.code).toBe('FORBIDDEN');

		const receptionistToken = await login(receptionist.email);
		const wrongProvider = await request(app.getHttpServer())
			.post('/patients')
			.set('Authorization', `Bearer ${receptionistToken}`)
			.send(
				patientBody(receptionist.id, {
					lastName: `BadProvider${suffix}`,
					email: `bad.${suffix}@synthetic.example`,
				}),
			)
			.expect(400);
		expect(wrongProvider.body.error).toMatchObject({
			code: 'VALIDATION_ERROR',
			details: [
				{
					path: 'providerId',
					message: 'Assigned provider must be a provider in this practice',
				},
			],
		});
	});

	it('limits nurses to assignments and hides cross-tenant ids', async () => {
		const receptionistToken = await login(receptionist.email);
		const assigned = await request(app.getHttpServer())
			.post('/patients')
			.set('Authorization', `Bearer ${receptionistToken}`)
			.send(
				patientBody(provider.id, {
					firstName: 'Assigned',
					lastName: `NurseVisible${suffix}`,
					email: `assigned.${suffix}@synthetic.example`,
				}),
			)
			.expect(201);
		const hidden = await request(app.getHttpServer())
			.post('/patients')
			.set('Authorization', `Bearer ${receptionistToken}`)
			.send(
				patientBody(provider.id, {
					firstName: 'Hidden',
					lastName: `Zephyr${suffix}`,
					email: `hidden.${suffix}@synthetic.example`,
				}),
			)
			.expect(201);

		const nurseToken = await login(nurse.email);
		const before = await request(app.getHttpServer())
			.get('/patients')
			.query({q: suffix})
			.set('Authorization', `Bearer ${nurseToken}`)
			.expect(200);
		expect(before.body.patients).toEqual([]);

		const missing = await request(app.getHttpServer())
			.get(`/patients/${hidden.body.id}`)
			.set('Authorization', `Bearer ${nurseToken}`)
			.expect(404);
		expect(missing.body.error).toMatchObject({code: 'NOT_FOUND', message: 'Resource not found'});
		expect(JSON.stringify(missing.body)).not.toContain(`Zephyr${suffix}`);
		expect(JSON.stringify(missing.body)).not.toContain(practiceA.id);

		await dataSource.getRepository(PatientAssignment).save({
			practiceId: practiceA.id,
			patientId: assigned.body.id,
			userId: nurse.id,
		});

		const after = await request(app.getHttpServer())
			.get('/patients')
			.query({q: `NurseVisible${suffix}`})
			.set('Authorization', `Bearer ${nurseToken}`)
			.expect(200);
		expect(after.body.patients.map((row: {id: string}) => row.id)).toEqual([assigned.body.id]);

		const foreign = await request(app.getHttpServer())
			.get(`/patients/${foreignPatient.id}`)
			.set('Authorization', `Bearer ${nurseToken}`)
			.expect(404);
		expect(foreign.body.error.code).toBe('NOT_FOUND');
		expect(JSON.stringify(foreign.body)).not.toContain(`Foreign${suffix}`);
		expect(JSON.stringify(foreign.body)).not.toContain(practiceB.id);
	});

	it('lets a patient user read only the linked record', async () => {
		const receptionistToken = await login(receptionist.email);
		const own = await request(app.getHttpServer())
			.post('/patients')
			.set('Authorization', `Bearer ${receptionistToken}`)
			.send(
				patientBody(provider.id, {
					firstName: 'Portal',
					lastName: `Self${suffix}`,
					email: `self.${suffix}@synthetic.example`,
				}),
			)
			.expect(201);
		const other = await request(app.getHttpServer())
			.post('/patients')
			.set('Authorization', `Bearer ${receptionistToken}`)
			.send(
				patientBody(provider.id, {
					firstName: 'Other',
					lastName: `Other${suffix}`,
					email: `other.${suffix}@synthetic.example`,
				}),
			)
			.expect(201);
		await dataSource.getRepository(Patient).update(own.body.id, {portalUserId: portalUser.id});

		const token = await login(portalUser.email);
		const listed = await request(app.getHttpServer())
			.get('/patients')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(listed.body.patients.map((row: {id: string}) => row.id)).toEqual([own.body.id]);

		const denied = await request(app.getHttpServer())
			.get(`/patients/${other.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(JSON.stringify(denied.body)).not.toContain(`Other${suffix}`);
	});

	it('rejects a client practice id that is not the session membership', async () => {
		const token = await login(receptionist.email);
		const mismatch = await request(app.getHttpServer())
			.post('/patients')
			.set('Authorization', `Bearer ${token}`)
			.send({
				...patientBody(provider.id, {
					lastName: `Mismatch${suffix}`,
					email: `mismatch.${suffix}@synthetic.example`,
				}),
				practiceId: practiceB.id,
			})
			.expect(403);
		expect(mismatch.body.error.code).toBe('FORBIDDEN');
		expect(JSON.stringify(mismatch.body)).not.toContain(practiceB.id);
	});

	it('paginates a name search', async () => {
		const token = await login(receptionist.email);
		for (let index = 0; index < 11; index += 1) {
			const label = String(index).padStart(2, '0');
			await request(app.getHttpServer())
				.post('/patients')
				.set('Authorization', `Bearer ${token}`)
				.send(
					patientBody(provider.id, {
						firstName: 'Page',
						lastName: `Pager${suffix}${label}`,
						email: `page${label}.${suffix}@synthetic.example`,
					}),
				)
				.expect(201);
		}

		const first = await request(app.getHttpServer())
			.get('/patients')
			.query({q: `Pager${suffix}`, sort: 'name-asc', page: 1})
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(first.body.patients).toHaveLength(10);
		expect(first.body.hasMore).toBe(true);
		expect(first.body.nextPage).toBe(2);

		const second = await request(app.getHttpServer())
			.get('/patients')
			.query({q: `Pager${suffix}`, sort: 'name-asc', page: 2})
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(second.body.patients).toHaveLength(1);
		expect(second.body.hasMore).toBe(false);
	});
});
