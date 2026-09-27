import {randomUUID} from 'node:crypto';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {DataSource, In} from 'typeorm';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {MAX_DOCUMENT_BYTES, syntheticPdfBytes} from '../src/documents/document-file.js';
import {MOCK_IDP_USERS, type MockIdpAccount} from '../src/identity/mock-idp.js';
import {configureApp} from '../src/platform/configure-app.js';
import {AuditEvent} from '../src/persistence/entities/audit-event.entity.js';
import {AuthSession} from '../src/persistence/entities/auth-session.entity.js';
import {PatientAssignment} from '../src/persistence/entities/patient-assignment.entity.js';
import {PatientDocument} from '../src/persistence/entities/patient-document.entity.js';
import {Patient} from '../src/persistence/entities/patient.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {syntheticPatientColumns} from './synthetic-patient.js';
import {createAdminDataSource} from './admin-data-source.js';

const password = 'Synthetic-Pass-1';
const pdf = syntheticPdfBytes();

describe('document HTTP', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let storageDir: string;
	let practiceA: Practice;
	let practiceB: Practice;
	let practiceAdmin: User;
	let receptionist: User;
	let provider: User;
	let nurse: User;
	let portalUser: User;
	let patient: Patient;
	let unassignedPatient: Patient;
	let foreignPatient: Patient;
	const suffix = randomUUID().slice(0, 8);

	beforeAll(async () => {
		storageDir = await mkdtemp(join(tmpdir(), 'medconnect-docs-'));
		process.env.DOCUMENT_STORAGE_DIR = storageDir;

		const adminEmail = `doc.admin.${suffix}@synthetic.example`;
		const receptionistEmail = `doc.receptionist.${suffix}@synthetic.example`;
		const providerEmail = `doc.provider.${suffix}@synthetic.example`;
		const nurseEmail = `doc.nurse.${suffix}@synthetic.example`;
		const portalEmail = `doc.portal.${suffix}@synthetic.example`;
		const catalog: MockIdpAccount[] = [
			{email: adminEmail, password, role: 'PRACTICE_ADMIN'},
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

		dataSource = await createAdminDataSource();
		app = moduleRef.createNestApplication();
		configureApp(app);
		await app.init();

		practiceA = await dataSource.getRepository(Practice).save({
			name: `Doc North ${suffix}`,
		});
		practiceB = await dataSource.getRepository(Practice).save({
			name: `Doc South ${suffix}`,
		});
		practiceAdmin = await dataSource.getRepository(User).save({email: adminEmail});
		receptionist = await dataSource.getRepository(User).save({email: receptionistEmail});
		provider = await dataSource.getRepository(User).save({email: providerEmail});
		nurse = await dataSource.getRepository(User).save({email: nurseEmail});
		portalUser = await dataSource.getRepository(User).save({email: portalEmail});
		const outsider = await dataSource.getRepository(User).save({
			email: `doc.outsider.${suffix}@synthetic.example`,
		});
		await dataSource.getRepository(PracticeMembership).save([
			{practiceId: practiceA.id, userId: practiceAdmin.id, role: 'PRACTICE_ADMIN'},
			{practiceId: practiceA.id, userId: receptionist.id, role: 'RECEPTIONIST'},
			{practiceId: practiceA.id, userId: provider.id, role: 'PROVIDER'},
			{practiceId: practiceA.id, userId: nurse.id, role: 'NURSE'},
			{practiceId: practiceA.id, userId: portalUser.id, role: 'PATIENT'},
			{practiceId: practiceB.id, userId: outsider.id, role: 'PROVIDER'},
		]);
		patient = await dataSource.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(provider.id, {
				firstName: 'Avery',
				lastName: `Doc${suffix}`,
				email: `avery.doc.${suffix}@synthetic.example`,
			}),
			portalUserId: portalUser.id,
		});
		unassignedPatient = await dataSource.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(provider.id, {
				firstName: 'Hidden',
				lastName: `ZephyrDoc${suffix}`,
				email: `hidden.doc.${suffix}@synthetic.example`,
			}),
		});
		foreignPatient = await dataSource.getRepository(Patient).save({
			practiceId: practiceB.id,
			...syntheticPatientColumns(outsider.id, {
				firstName: 'Casey',
				lastName: `ForeignDoc${suffix}`,
				email: `foreign.doc.${suffix}@synthetic.example`,
			}),
		});
		await dataSource.getRepository(PatientAssignment).save({
			practiceId: practiceA.id,
			patientId: patient.id,
			userId: nurse.id,
		});
	});

	afterAll(async () => {
		if (storageDir) {
			await rm(storageDir, {recursive: true, force: true});
		}
		if (!dataSource?.isInitialized) {
			await app?.close();
			return;
		}
		const practiceIds = [practiceA, practiceB].filter(Boolean).map((item) => item.id);
		const users = await dataSource.getRepository(User).find({
			where: [
				{email: practiceAdmin?.email},
				{email: receptionist?.email},
				{email: provider?.email},
				{email: nurse?.email},
				{email: portalUser?.email},
				{email: `doc.outsider.${suffix}@synthetic.example`},
			],
		});
		const userIds = users.map((user) => user.id);
		if (practiceIds.length > 0) {
			await dataSource.getRepository(AuditEvent).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(PatientDocument).delete({practiceId: In(practiceIds)});
		}
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
		if (dataSource?.isInitialized) {
			await dataSource.destroy();
		}
	});

	async function login(email: string): Promise<string> {
		const response = await request(app.getHttpServer())
			.post('/auth/login')
			.send({email, password})
			.expect(200);
		return response.body.accessToken as string;
	}

	it('rejects anonymous access and invalid files', async () => {
		const anonymous = await request(app.getHttpServer())
			.get(`/patients/${patient.id}/documents`)
			.expect(401);
		expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');

		const token = await login(provider.email);
		const missingFile = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/documents`)
			.set('Authorization', `Bearer ${token}`)
			.field('category', 'intake')
			.expect(400);
		expect(missingFile.body.error.code).toBe('VALIDATION_ERROR');

		const spoofed = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/documents`)
			.set('Authorization', `Bearer ${token}`)
			.field('category', 'intake')
			.attach('file', Buffer.from('not-a-pdf'), 'notes.pdf')
			.expect(400);
		expect(spoofed.body.error.code).toBe('VALIDATION_ERROR');
		expect(JSON.stringify(spoofed.body)).not.toMatch(/stack|password/i);

		const oversized = Buffer.concat([pdf, Buffer.alloc(MAX_DOCUMENT_BYTES)]);
		const tooBig = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/documents`)
			.set('Authorization', `Bearer ${token}`)
			.field('category', 'intake')
			.attach('file', oversized, 'huge.pdf')
			.expect(400);
		expect(tooBig.body.error.code).toBe('VALIDATION_ERROR');
	});

	it('lets a provider upload, list, and download matching bytes', async () => {
		const token = await login(provider.email);
		const uploaded = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/documents`)
			.set('Authorization', `Bearer ${token}`)
			.set('X-Correlation-ID', `cid-doc-${suffix}`)
			.field('category', 'intake')
			.attach('file', pdf, 'Intake summary.pdf')
			.expect(201);
		expect(uploaded.body.synthetic).toBe(true);
		expect(uploaded.body.name).toBe('Intake summary.pdf');
		expect(uploaded.body.contentType).toBe('application/pdf');
		expect(uploaded.body.category).toBe('intake');
		expect(uploaded.body.uploadedById).toBe(provider.id);
		expect(uploaded.body.patientId).toBe(patient.id);
		expect(uploaded.body).not.toHaveProperty('storageKey');
		expect(uploaded.body).not.toHaveProperty('practiceId');

		const listed = await request(app.getHttpServer())
			.get(`/patients/${patient.id}/documents`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(listed.body.documents.map((row: {id: string}) => row.id)).toContain(uploaded.body.id);

		const downloaded = await request(app.getHttpServer())
			.get(`/patients/${patient.id}/documents/${uploaded.body.id}/content`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(downloaded.headers['content-type']).toMatch(/application\/pdf/);
		expect(Buffer.from(downloaded.body).equals(pdf) || downloaded.text.includes('%PDF')).toBe(true);

		const audits = await dataSource.getRepository(AuditEvent).find({
			where: {practiceId: practiceA.id, resourceId: uploaded.body.id},
		});
		expect(audits.some((event) => event.action === 'document.uploaded')).toBe(true);
		expect(audits.some((event) => event.action === 'document.downloaded')).toBe(true);
		const uploadedAudit = audits.find((event) => event.action === 'document.uploaded');
		expect(uploadedAudit?.correlationId).toBe(`cid-doc-${suffix}`);
		expect(uploadedAudit?.resourceType).toBe('document');
		expect(JSON.stringify(audits)).not.toContain('Intake summary');
		expect(JSON.stringify(audits)).not.toContain('%PDF');
	});

	it('denies document access to a receptionist, practice admin, and assigned nurse', async () => {
		for (const email of [receptionist.email, practiceAdmin.email, nurse.email]) {
			const token = await login(email);
			const getDenied = await request(app.getHttpServer())
				.get(`/patients/${patient.id}/documents`)
				.set('Authorization', `Bearer ${token}`)
				.expect(403);
			expect(getDenied.body.error.code).toBe('FORBIDDEN');
			const postDenied = await request(app.getHttpServer())
				.post(`/patients/${patient.id}/documents`)
				.set('Authorization', `Bearer ${token}`)
				.field('category', 'intake')
				.attach('file', pdf, 'intake.pdf')
				.expect(403);
			expect(postDenied.body.error.code).toBe('FORBIDDEN');
		}
	});

	it('hides unassigned patients from a nurse', async () => {
		const token = await login(nurse.email);
		const missing = await request(app.getHttpServer())
			.get(`/patients/${unassignedPatient.id}/documents`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(missing.body.error).toMatchObject({code: 'NOT_FOUND', message: 'Resource not found'});
		expect(JSON.stringify(missing.body)).not.toContain(`ZephyrDoc${suffix}`);
	});

	it('lets a portal user read and download own documents and denies uploads and other patients', async () => {
		const providerToken = await login(provider.email);
		const uploaded = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/documents`)
			.set('Authorization', `Bearer ${providerToken}`)
			.field('category', 'clinical')
			.attach('file', pdf, 'portal-visible.pdf')
			.expect(201);

		const token = await login(portalUser.email);
		const own = await request(app.getHttpServer())
			.get(`/patients/${patient.id}/documents`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(own.body.documents.some((row: {id: string}) => row.id === uploaded.body.id)).toBe(true);

		await request(app.getHttpServer())
			.get(`/patients/${patient.id}/documents/${uploaded.body.id}/content`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);

		const writeDenied = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/documents`)
			.set('Authorization', `Bearer ${token}`)
			.field('category', 'intake')
			.attach('file', pdf, 'portal-upload.pdf')
			.expect(403);
		expect(writeDenied.body.error.code).toBe('FORBIDDEN');

		const other = await request(app.getHttpServer())
			.get(`/patients/${unassignedPatient.id}/documents`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(other.body.error.code).toBe('NOT_FOUND');
		expect(JSON.stringify(other.body)).not.toContain(`ZephyrDoc${suffix}`);
	});

	it('hides a cross-tenant patient and rejects a client practice id', async () => {
		const token = await login(provider.email);
		const missing = await request(app.getHttpServer())
			.get(`/patients/${foreignPatient.id}/documents`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(missing.body.error.code).toBe('NOT_FOUND');
		expect(JSON.stringify(missing.body)).not.toContain(practiceB.id);
		expect(JSON.stringify(missing.body)).not.toContain(`ForeignDoc${suffix}`);

		const unknown = await request(app.getHttpServer())
			.get(`/patients/${patient.id}/documents/${randomUUID()}/content`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(unknown.body.error.code).toBe('NOT_FOUND');

		const mismatch = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/documents`)
			.set('Authorization', `Bearer ${token}`)
			.field('category', 'intake')
			.field('practiceId', practiceB.id)
			.attach('file', pdf, 'cross-tenant.pdf')
			.expect(403);
		expect(mismatch.body.error.code).toBe('FORBIDDEN');
		expect(JSON.stringify(mismatch.body)).not.toContain(practiceB.id);
	});
});
