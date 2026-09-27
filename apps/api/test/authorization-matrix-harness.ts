import {randomUUID} from 'node:crypto';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {In} from 'typeorm';
import {AppModule} from '../src/app.module.js';
import {MOCK_IDP_USERS, type MockIdpAccount} from '../src/identity/mock-idp.js';
import {configureApp} from '../src/platform/configure-app.js';
import {Appointment} from '../src/persistence/entities/appointment.entity.js';
import {AuditEvent} from '../src/persistence/entities/audit-event.entity.js';
import {AuthSession} from '../src/persistence/entities/auth-session.entity.js';
import {ClinicalCondition} from '../src/persistence/entities/clinical-condition.entity.js';
import {ClinicalHistory} from '../src/persistence/entities/clinical-history.entity.js';
import {InvoiceLineItem} from '../src/persistence/entities/invoice-line-item.entity.js';
import {Invoice} from '../src/persistence/entities/invoice.entity.js';
import {Medication} from '../src/persistence/entities/medication.entity.js';
import {NotificationPreference} from '../src/persistence/entities/notification-preference.entity.js';
import {Notification} from '../src/persistence/entities/notification.entity.js';
import {PatientAssignment} from '../src/persistence/entities/patient-assignment.entity.js';
import {PatientDocument} from '../src/persistence/entities/patient-document.entity.js';
import {Patient} from '../src/persistence/entities/patient.entity.js';
import {Payment} from '../src/persistence/entities/payment.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {TelehealthSession} from '../src/persistence/entities/telehealth-session.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {Vital} from '../src/persistence/entities/vital.entity.js';
import type {PracticeRole} from '../src/tenancy/practice-role.js';
import type {PatientDemographics} from '../src/practice/patient.repository.js';
import {createAdminDataSource} from './admin-data-source.js';
import {syntheticDemographics, syntheticPatientColumns} from './synthetic-patient.js';

export const MATRIX_PASSWORD = 'Synthetic-Pass-1';

export type MatrixActor =
	| 'provider'
	| 'nurse'
	| 'receptionist'
	| 'patient'
	| 'practiceAdmin'
	| 'outsider';

export type MatrixActorRecord = {
	id: string;
	email: string;
	role: PracticeRole;
};

export type AuthorizationMatrixHarness = {
	app: INestApplication;
	suffix: string;
	practiceAId: string;
	practiceBId: string;
	providerId: string;
	actors: Record<MatrixActor, MatrixActorRecord>;
	assignedPatientId: string;
	unassignedPatientId: string;
	foreignPatientId: string;
	assignedLastName: string;
	unassignedLastName: string;
	foreignLastName: string;
	appointmentId: string;
	foreignAppointmentId: string;
	invoiceId: string;
	foreignInvoiceId: string;
	joinSessionId: string;
	createSessionAppointmentId: string;
	foreignSessionId: string;
	login: (email: string) => Promise<string>;
	patientBody: (overrides?: Partial<PatientDemographics>) => Record<string, unknown>;
	dispose: () => Promise<void>;
};

export async function createAuthorizationMatrixHarness(): Promise<AuthorizationMatrixHarness> {
	const suffix = randomUUID().slice(0, 8);
	const storageDir = await mkdtemp(join(tmpdir(), `medconnect-matrix-${suffix}-`));
	process.env.DOCUMENT_STORAGE_DIR = storageDir;

	const emails = {
		practiceAdmin: `matrix.admin.${suffix}@synthetic.example`,
		receptionist: `matrix.receptionist.${suffix}@synthetic.example`,
		provider: `matrix.provider.${suffix}@synthetic.example`,
		nurse: `matrix.nurse.${suffix}@synthetic.example`,
		patient: `matrix.portal.${suffix}@synthetic.example`,
		outsider: `matrix.outsider.${suffix}@synthetic.example`,
	};
	const catalog: MockIdpAccount[] = [
		{email: emails.practiceAdmin, password: MATRIX_PASSWORD, role: 'PRACTICE_ADMIN'},
		{email: emails.receptionist, password: MATRIX_PASSWORD, role: 'RECEPTIONIST'},
		{email: emails.provider, password: MATRIX_PASSWORD, role: 'PROVIDER'},
		{email: emails.nurse, password: MATRIX_PASSWORD, role: 'NURSE'},
		{email: emails.patient, password: MATRIX_PASSWORD, role: 'PATIENT'},
		{email: emails.outsider, password: MATRIX_PASSWORD, role: 'PROVIDER'},
	];

	const moduleRef = await Test.createTestingModule({
		imports: [AppModule],
	})
		.overrideProvider(MOCK_IDP_USERS)
		.useValue(catalog)
		.compile();

	const dataSource = await createAdminDataSource();
	const app = moduleRef.createNestApplication();
	configureApp(app);
	await app.init();

	const practiceA = await dataSource.getRepository(Practice).save({
		name: `Matrix North ${suffix}`,
	});
	const practiceB = await dataSource.getRepository(Practice).save({
		name: `Matrix South ${suffix}`,
	});
	const practiceAdmin = await dataSource.getRepository(User).save({email: emails.practiceAdmin});
	const receptionist = await dataSource.getRepository(User).save({email: emails.receptionist});
	const provider = await dataSource.getRepository(User).save({email: emails.provider});
	const nurse = await dataSource.getRepository(User).save({email: emails.nurse});
	const portalUser = await dataSource.getRepository(User).save({email: emails.patient});
	const outsider = await dataSource.getRepository(User).save({email: emails.outsider});
	await dataSource.getRepository(PracticeMembership).save([
		{practiceId: practiceA.id, userId: practiceAdmin.id, role: 'PRACTICE_ADMIN'},
		{practiceId: practiceA.id, userId: receptionist.id, role: 'RECEPTIONIST'},
		{practiceId: practiceA.id, userId: provider.id, role: 'PROVIDER'},
		{practiceId: practiceA.id, userId: nurse.id, role: 'NURSE'},
		{practiceId: practiceA.id, userId: portalUser.id, role: 'PATIENT'},
		{practiceId: practiceB.id, userId: outsider.id, role: 'PROVIDER'},
	]);

	const assignedLastName = `Assigned${suffix}`;
	const unassignedLastName = `Zephyr${suffix}`;
	const foreignLastName = `Foreign${suffix}`;
	const assignedPatient = await dataSource.getRepository(Patient).save({
		practiceId: practiceA.id,
		...syntheticPatientColumns(provider.id, {
			firstName: 'Avery',
			lastName: assignedLastName,
			email: `avery.matrix.${suffix}@synthetic.example`,
		}),
		portalUserId: portalUser.id,
	});
	const unassignedPatient = await dataSource.getRepository(Patient).save({
		practiceId: practiceA.id,
		...syntheticPatientColumns(provider.id, {
			firstName: 'Blake',
			lastName: unassignedLastName,
			email: `blake.matrix.${suffix}@synthetic.example`,
		}),
	});
	const foreignPatient = await dataSource.getRepository(Patient).save({
		practiceId: practiceB.id,
		...syntheticPatientColumns(outsider.id, {
			firstName: 'Casey',
			lastName: foreignLastName,
			email: `casey.matrix.${suffix}@synthetic.example`,
		}),
	});
	await dataSource.getRepository(PatientAssignment).save({
		practiceId: practiceA.id,
		patientId: assignedPatient.id,
		userId: nurse.id,
	});

	const officeAppointment = await dataSource.getRepository(Appointment).save({
		practiceId: practiceA.id,
		patientId: assignedPatient.id,
		providerUserId: provider.id,
		startAt: new Date('2026-11-01T14:00:00.000Z'),
		endAt: new Date('2026-11-01T15:00:00.000Z'),
		type: 'office_visit',
		state: 'scheduled',
		notes: null,
		synthetic: true,
	});
	const joinStart = new Date(Date.now() - 5 * 60 * 1000);
	const joinEnd = new Date(Date.now() + 55 * 60 * 1000);
	const joinAppointment = await dataSource.getRepository(Appointment).save({
		practiceId: practiceA.id,
		patientId: assignedPatient.id,
		providerUserId: provider.id,
		startAt: joinStart,
		endAt: joinEnd,
		type: 'telehealth',
		state: 'scheduled',
		notes: null,
		synthetic: true,
	});
	const createSessionAppointment = await dataSource.getRepository(Appointment).save({
		practiceId: practiceA.id,
		patientId: assignedPatient.id,
		providerUserId: provider.id,
		startAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
		endAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
		type: 'telehealth',
		state: 'scheduled',
		notes: null,
		synthetic: true,
	});
	const foreignAppointment = await dataSource.getRepository(Appointment).save({
		practiceId: practiceB.id,
		patientId: foreignPatient.id,
		providerUserId: outsider.id,
		startAt: new Date('2026-11-02T14:00:00.000Z'),
		endAt: new Date('2026-11-02T15:00:00.000Z'),
		type: 'telehealth',
		state: 'scheduled',
		notes: null,
		synthetic: true,
	});
	const joinSession = await dataSource.getRepository(TelehealthSession).save({
		practiceId: practiceA.id,
		appointmentId: joinAppointment.id,
		state: 'waiting',
		waitingStartedAt: new Date(),
		synthetic: true,
	});
	const foreignSession = await dataSource.getRepository(TelehealthSession).save({
		practiceId: practiceB.id,
		appointmentId: foreignAppointment.id,
		state: 'waiting',
		waitingStartedAt: new Date(),
		synthetic: true,
	});

	const assignedInvoice = await dataSource.getRepository(Invoice).save({
		practiceId: practiceA.id,
		patientId: assignedPatient.id,
		status: 'issued',
		amountCents: 15000,
		currency: 'USD',
		issuedAt: new Date('2026-09-01T00:00:00.000Z'),
		dueAt: new Date('2027-01-15T00:00:00.000Z'),
		synthetic: true,
	});
	await dataSource.getRepository(InvoiceLineItem).save({
		practiceId: practiceA.id,
		invoiceId: assignedInvoice.id,
		description: 'Office visit',
		amountCents: 15000,
	});
	const foreignInvoice = await dataSource.getRepository(Invoice).save({
		practiceId: practiceB.id,
		patientId: foreignPatient.id,
		status: 'issued',
		amountCents: 9000,
		currency: 'USD',
		issuedAt: new Date('2026-09-01T00:00:00.000Z'),
		dueAt: new Date('2027-01-15T00:00:00.000Z'),
		synthetic: true,
	});
	await dataSource.getRepository(InvoiceLineItem).save({
		practiceId: practiceB.id,
		invoiceId: foreignInvoice.id,
		description: 'Office visit',
		amountCents: 9000,
	});

	const actors: Record<MatrixActor, MatrixActorRecord> = {
		practiceAdmin: {id: practiceAdmin.id, email: practiceAdmin.email, role: 'PRACTICE_ADMIN'},
		receptionist: {id: receptionist.id, email: receptionist.email, role: 'RECEPTIONIST'},
		provider: {id: provider.id, email: provider.email, role: 'PROVIDER'},
		nurse: {id: nurse.id, email: nurse.email, role: 'NURSE'},
		patient: {id: portalUser.id, email: portalUser.email, role: 'PATIENT'},
		outsider: {id: outsider.id, email: outsider.email, role: 'PROVIDER'},
	};

	async function login(email: string): Promise<string> {
		const response = await request(app.getHttpServer())
			.post('/auth/login')
			.send({email, password: MATRIX_PASSWORD})
			.expect(200);
		return response.body.accessToken as string;
	}

	function patientBody(overrides: Partial<PatientDemographics> = {}): Record<string, unknown> {
		const demographics = syntheticDemographics(provider.id, {
			email: `create.${randomUUID().slice(0, 8)}@synthetic.example`,
			lastName: `Create${suffix}`,
			...overrides,
		});
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

	async function dispose(): Promise<void> {
		try {
			if (dataSource?.isInitialized) {
				const practiceIds = [practiceA.id, practiceB.id];
				const userIds = Object.values(actors).map((actor) => actor.id);
				await dataSource.getRepository(AuditEvent).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(AuthSession).delete({userId: In(userIds)});
				await dataSource.getRepository(Payment).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(InvoiceLineItem).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(Invoice).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(Notification).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(NotificationPreference).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(TelehealthSession).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(Appointment).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(PatientDocument).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(ClinicalHistory).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(ClinicalCondition).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(Vital).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(Medication).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(PatientAssignment).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(Patient).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(PracticeMembership).delete({practiceId: In(practiceIds)});
				await dataSource.getRepository(User).delete({id: In(userIds)});
				await dataSource.getRepository(Practice).delete({id: In(practiceIds)});
			}
		} finally {
			await app?.close();
			if (dataSource?.isInitialized) {
				await dataSource.destroy();
			}
			await rm(storageDir, {recursive: true, force: true});
		}
	}

	return {
		app,
		suffix,
		practiceAId: practiceA.id,
		practiceBId: practiceB.id,
		providerId: provider.id,
		actors,
		assignedPatientId: assignedPatient.id,
		unassignedPatientId: unassignedPatient.id,
		foreignPatientId: foreignPatient.id,
		assignedLastName,
		unassignedLastName,
		foreignLastName,
		appointmentId: officeAppointment.id,
		foreignAppointmentId: foreignAppointment.id,
		invoiceId: assignedInvoice.id,
		foreignInvoiceId: foreignInvoice.id,
		joinSessionId: joinSession.id,
		createSessionAppointmentId: createSessionAppointment.id,
		foreignSessionId: foreignSession.id,
		login,
		patientBody,
		dispose,
	};
}
