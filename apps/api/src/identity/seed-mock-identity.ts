import {randomUUID} from 'node:crypto';
import {mkdir, writeFile} from 'node:fs/promises';
import {basename, dirname, join, resolve} from 'node:path';
import {Logger} from '@nestjs/common';
import {DataSource, type Repository} from 'typeorm';
import {syntheticPdfBytes} from '../documents/document-file.js';
import {documentStorageKey} from '../documents/document-storage-key.js';
import {Appointment, type AppointmentType} from '../persistence/entities/appointment.entity.js';
import {ClinicalCondition} from '../persistence/entities/clinical-condition.entity.js';
import {ClinicalHistory} from '../persistence/entities/clinical-history.entity.js';
import {InvoiceLineItem} from '../persistence/entities/invoice-line-item.entity.js';
import {Invoice} from '../persistence/entities/invoice.entity.js';
import {Medication} from '../persistence/entities/medication.entity.js';
import {Notification} from '../persistence/entities/notification.entity.js';
import {PatientDocument} from '../persistence/entities/patient-document.entity.js';
import {Patient} from '../persistence/entities/patient.entity.js';
import {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import {Practice} from '../persistence/entities/practice.entity.js';
import {TelehealthSession} from '../persistence/entities/telehealth-session.entity.js';
import {User} from '../persistence/entities/user.entity.js';
import {Vital} from '../persistence/entities/vital.entity.js';
import {resolveAdminDatabaseUrl} from '../persistence/default-database-url.js';
import {postgresConnectionOptions} from '../persistence/typeorm.options.js';
import {defaultMockIdpAccounts} from './mock-idp.js';
import {
	currentMonthIssuedAt,
	EXTRA_FUTURE_APPOINTMENTS,
	EXTRA_SEEDED_PATIENTS,
	futureAppointmentWindow,
	SEEDED_CURRENT_MONTH_INVOICES,
	SEEDED_INBOX_ITEMS,
	secondTodayAppointmentWindow,
	TODAY_OFFICE_NOTES,
	TODAY_OFFICE_PATIENT_EMAIL,
	utcDateKey,
	type SeededPatientDemographics,
} from './seed-mock-identity-corpus.js';

export const DEMO_EMAIL = 'practice.admin@example.test';
export const PRACTICE_NAME = 'Harbor Synthetic Practice';

/**
 * Stable synthetic provider for the live patient form.
 * Must match `LIVE_DEMO_PROVIDER_ID` in `apps/web/src/lib/api/live-demo-provider.ts`.
 */
export const LIVE_DEMO_PROVIDER_ID = '11111111-1111-4111-8111-111111111111';
export const PROVIDER_EMAIL = 'jordan.ellis@synthetic.example';
/**
 * Stable synthetic MFA nurse for the live mock MFA challenge (FE-028).
 * Must match `userId` in `docs/mocks/demo-users.json`.
 */
export const LIVE_DEMO_MFA_NURSE_ID = '33333333-3333-4333-8333-333333333333';
export const MFA_NURSE_EMAIL = 'mfa.nurse@example.test';
const LIVE_TELEHEALTH_NOTES = 'Live demo telehealth visit';
const ANNUAL_FOLLOW_UP_NOTES = 'Annual follow-up';

const SEEDED_PATIENTS: readonly SeededPatientDemographics[] = [
	{
		firstName: 'Avery',
		lastName: 'Quinn',
		dateOfBirth: '1988-04-12',
		gender: 'female',
		status: 'active',
		phone: '555-0100',
		email: 'avery.quinn@synthetic.example',
		street: '100 Demo Street',
		city: 'Harborview',
		state: 'WA',
		postalCode: '98101',
		emergencyContactName: 'Sky Quinn',
		emergencyContactRelationship: 'Sibling',
		emergencyContactPhone: '555-0101',
		insuranceProvider: 'Synthetic Health Plan',
		insurancePolicyNumber: 'SYN-100',
		insuranceGroupNumber: 'GRP-1',
	},
	{
		firstName: 'Blake',
		lastName: 'Chen',
		dateOfBirth: '1992-11-02',
		gender: 'male',
		status: 'active',
		phone: '555-0102',
		email: 'blake.chen@synthetic.example',
		street: '200 Demo Street',
		city: 'Harborview',
		state: 'WA',
		postalCode: '98101',
		emergencyContactName: 'Rowan Chen',
		emergencyContactRelationship: 'Parent',
		emergencyContactPhone: '555-0103',
		insuranceProvider: 'Synthetic Health Plan',
		insurancePolicyNumber: 'SYN-200',
		insuranceGroupNumber: 'GRP-1',
	},
];

function safeError(error: unknown): string {
	if (!(error instanceof Error)) {
		return 'Seed failed';
	}
	const message = error.message.toLowerCase();
	if (message.includes('://') || message.includes('password')) {
		return error.name;
	}
	return error.message;
}

async function upsertPatient(
	patients: Repository<Patient>,
	practiceId: string,
	providerId: string,
	demographics: SeededPatientDemographics,
): Promise<void> {
	const existing = await patients.findOne({
		where: {practiceId, email: demographics.email},
	});
	if (existing) {
		return;
	}
	await patients.save({
		...demographics,
		practiceId,
		assignedProviderUserId: providerId,
		synthetic: true,
	});
}

async function upsertAppointmentByNotes(
	appointments: Repository<Appointment>,
	input: {
		practiceId: string;
		providerId: string;
		patientId: string;
		notes: string;
		type: AppointmentType;
		startAt: Date;
		endAt: Date;
		refresh: boolean;
	},
): Promise<void> {
	const existing = await appointments.findOne({
		where: {practiceId: input.practiceId, notes: input.notes},
	});
	if (!existing) {
		await appointments.save({
			practiceId: input.practiceId,
			patientId: input.patientId,
			providerUserId: input.providerId,
			startAt: input.startAt,
			endAt: input.endAt,
			type: input.type,
			state: 'scheduled',
			notes: input.notes,
			synthetic: true,
		});
		return;
	}
	if (!input.refresh) {
		return;
	}
	existing.patientId = input.patientId;
	existing.providerUserId = input.providerId;
	existing.startAt = input.startAt;
	existing.endAt = input.endAt;
	existing.type = input.type;
	existing.state = 'scheduled';
	await appointments.save(existing);
}

async function parkAppointmentByNotes(
	appointments: Repository<Appointment>,
	practiceId: string,
	notes: string,
	now: Date,
	dayOffset = 40,
): Promise<void> {
	const existing = await appointments.findOne({where: {practiceId, notes}});
	if (!existing) {
		return;
	}
	const parkedDay = utcDateKey(new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000));
	existing.startAt = new Date(`${parkedDay}T18:00:00.000Z`);
	existing.endAt = new Date(`${parkedDay}T19:00:00.000Z`);
	await appointments.save(existing);
}

export async function seedMockIdentity(): Promise<void> {
	const account = defaultMockIdpAccounts.find((item) => item.email === DEMO_EMAIL);
	if (!account) {
		throw new Error('Demo mock IdP account is missing');
	}

	const dataSource = new DataSource(postgresConnectionOptions(resolveAdminDatabaseUrl()));
	await dataSource.initialize();
	try {
		await dataSource.runMigrations();
		const users = dataSource.getRepository(User);
		const practices = dataSource.getRepository(Practice);
		const memberships = dataSource.getRepository(PracticeMembership);
		const patients = dataSource.getRepository(Patient);
		const appointments = dataSource.getRepository(Appointment);
		const telehealthSessions = dataSource.getRepository(TelehealthSession);
		const historyRows = dataSource.getRepository(ClinicalHistory);
		const conditionRows = dataSource.getRepository(ClinicalCondition);
		const vitalRows = dataSource.getRepository(Vital);
		const medicationRows = dataSource.getRepository(Medication);
		const documentRows = dataSource.getRepository(PatientDocument);
		const invoiceRows = dataSource.getRepository(Invoice);
		const lineItemRows = dataSource.getRepository(InvoiceLineItem);
		const notificationRows = dataSource.getRepository(Notification);

		let admin = await users.findOne({where: {email: account.email}});
		if (!admin) {
			admin = await users.save({email: account.email});
		}

		let membership = await memberships.findOne({where: {userId: admin.id}});
		let practice: Practice | null = null;
		if (membership) {
			practice = await practices.findOne({where: {id: membership.practiceId}});
		}
		if (!practice) {
			practice = await practices.findOne({where: {name: PRACTICE_NAME}});
		}
		if (!practice) {
			practice = await practices.save({name: PRACTICE_NAME});
		}
		if (!membership) {
			await memberships.save({
				practiceId: practice.id,
				userId: admin.id,
				role: account.role,
			});
		}

		let provider = await users.findOne({where: {id: LIVE_DEMO_PROVIDER_ID}});
		if (!provider) {
			provider = await users.findOne({where: {email: PROVIDER_EMAIL}});
		}
		if (!provider) {
			provider = await users.save({id: LIVE_DEMO_PROVIDER_ID, email: PROVIDER_EMAIL});
		}
		const providerMembership = await memberships.findOne({
			where: {practiceId: practice.id, userId: provider.id},
		});
		if (!providerMembership) {
			await memberships.save({
				practiceId: practice.id,
				userId: provider.id,
				role: 'PROVIDER',
			});
		}

		let mfaNurse = await users.findOne({where: {id: LIVE_DEMO_MFA_NURSE_ID}});
		if (!mfaNurse) {
			mfaNurse = await users.findOne({where: {email: MFA_NURSE_EMAIL}});
		}
		if (!mfaNurse) {
			mfaNurse = await users.save({id: LIVE_DEMO_MFA_NURSE_ID, email: MFA_NURSE_EMAIL});
		}
		const mfaNurseMembership = await memberships.findOne({
			where: {practiceId: practice.id, userId: mfaNurse.id},
		});
		if (!mfaNurseMembership) {
			await memberships.save({
				practiceId: practice.id,
				userId: mfaNurse.id,
				role: 'NURSE',
			});
		}

		for (const demographics of [...SEEDED_PATIENTS, ...EXTRA_SEEDED_PATIENTS]) {
			await upsertPatient(patients, practice.id, provider.id, demographics);
		}

		const seededPatient = await patients.findOne({
			where: {practiceId: practice.id, email: SEEDED_PATIENTS[0].email},
		});
		const now = new Date();
		const telehealthStart = new Date(now.getTime() - 2 * 60 * 1000);
		const telehealthEnd = new Date(now.getTime() + 45 * 60 * 1000);
		await parkAppointmentByNotes(appointments, practice.id, TODAY_OFFICE_NOTES, now);

		if (seededPatient) {
			await upsertAppointmentByNotes(appointments, {
				practiceId: practice.id,
				providerId: provider.id,
				patientId: seededPatient.id,
				notes: ANNUAL_FOLLOW_UP_NOTES,
				type: 'office_visit',
				startAt: new Date('2026-10-15T14:00:00.000Z'),
				endAt: new Date('2026-10-15T15:00:00.000Z'),
				refresh: false,
			});

			let liveTelehealth = await appointments.findOne({
				where: {practiceId: practice.id, patientId: seededPatient.id, notes: LIVE_TELEHEALTH_NOTES},
			});
			if (!liveTelehealth) {
				liveTelehealth = await appointments.save({
					practiceId: practice.id,
					patientId: seededPatient.id,
					providerUserId: provider.id,
					startAt: telehealthStart,
					endAt: telehealthEnd,
					type: 'telehealth',
					state: 'scheduled',
					notes: LIVE_TELEHEALTH_NOTES,
					synthetic: true,
				});
			} else {
				liveTelehealth.providerUserId = provider.id;
				liveTelehealth.startAt = telehealthStart;
				liveTelehealth.endAt = telehealthEnd;
				liveTelehealth.type = 'telehealth';
				liveTelehealth.state = 'scheduled';
				await appointments.save(liveTelehealth);
			}
			await telehealthSessions.delete({appointmentId: liveTelehealth.id});

			const existingHistory = await historyRows.findOne({
				where: {practiceId: practice.id, patientId: seededPatient.id},
			});
			if (!existingHistory) {
				await historyRows.save({
					practiceId: practice.id,
					patientId: seededPatient.id,
					type: 'visit',
					occurredAt: new Date('2025-07-15T10:30:00.000Z'),
					title: 'Hypertension follow-up',
					summary: 'Blood pressure stable on current medication. Continue current plan.',
					providerUserId: provider.id,
					status: 'completed',
					synthetic: true,
				});
			}

			const existingCondition = await conditionRows.findOne({
				where: {practiceId: practice.id, patientId: seededPatient.id},
			});
			if (!existingCondition) {
				await conditionRows.save({
					practiceId: practice.id,
					patientId: seededPatient.id,
					display: 'Hypertension',
					clinicalStatus: 'active',
					recordedAt: new Date('2025-07-15T10:30:00.000Z'),
					recordedByUserId: provider.id,
					synthetic: true,
				});
			}

			const existingVital = await vitalRows.findOne({
				where: {practiceId: practice.id, patientId: seededPatient.id},
			});
			if (!existingVital) {
				await vitalRows.save({
					practiceId: practice.id,
					patientId: seededPatient.id,
					recordedAt: new Date('2025-07-15T10:15:00.000Z'),
					systolicMmHg: 128,
					diastolicMmHg: 82,
					heartRateBpm: 72,
					temperatureC: 36.7,
					respiratoryRate: 16,
					spo2Percent: 98,
					weightKg: 72.5,
					recordedByUserId: provider.id,
					synthetic: true,
				});
			}

			const existingMedication = await medicationRows.findOne({
				where: {practiceId: practice.id, patientId: seededPatient.id},
			});
			if (!existingMedication) {
				await medicationRows.save({
					practiceId: practice.id,
					patientId: seededPatient.id,
					name: 'Lisinopril',
					dosage: '10mg',
					frequency: 'Once daily',
					route: 'oral',
					startDate: '2023-01-10',
					instructions: 'Take in the morning with water',
					prescriberUserId: provider.id,
					status: 'active',
					synthetic: true,
				});
			}

			const existingDocument = await documentRows.findOne({
				where: {practiceId: practice.id, patientId: seededPatient.id},
			});
			if (!existingDocument) {
				const documentId = randomUUID();
				const storageKey = documentStorageKey(practice.id, seededPatient.id, documentId);
				const bytes = syntheticPdfBytes();
				const storageRoot = resolve(process.env.DOCUMENT_STORAGE_DIR || '.document-storage');
				const storagePath = join(storageRoot, storageKey);
				await mkdir(dirname(storagePath), {recursive: true});
				await writeFile(storagePath, bytes);
				await documentRows.save({
					id: documentId,
					practiceId: practice.id,
					patientId: seededPatient.id,
					name: 'Intake summary.pdf',
					contentType: 'application/pdf',
					category: 'intake',
					sizeBytes: bytes.length,
					storageKey,
					uploadedByUserId: provider.id,
					synthetic: true,
				});
			}

			const existingIssued = await invoiceRows.findOne({
				where: {practiceId: practice.id, patientId: seededPatient.id, amountCents: 15000},
			});
			if (!existingIssued) {
				const issued = await invoiceRows.save({
					practiceId: practice.id,
					patientId: seededPatient.id,
					status: 'issued',
					amountCents: 15000,
					currency: 'USD',
					issuedAt: new Date('2026-09-01T00:00:00.000Z'),
					dueAt: new Date('2026-09-15T00:00:00.000Z'),
					synthetic: true,
				});
				await lineItemRows.save({
					practiceId: practice.id,
					invoiceId: issued.id,
					description: 'Office visit',
					amountCents: 15000,
				});
			}
			const existingPaid = await invoiceRows.findOne({
				where: {practiceId: practice.id, patientId: seededPatient.id, amountCents: 8000},
			});
			if (!existingPaid) {
				const paid = await invoiceRows.save({
					practiceId: practice.id,
					patientId: seededPatient.id,
					status: 'paid',
					amountCents: 8000,
					currency: 'USD',
					issuedAt: new Date('2026-08-10T00:00:00.000Z'),
					dueAt: new Date('2026-08-24T00:00:00.000Z'),
					synthetic: true,
				});
				await lineItemRows.save({
					practiceId: practice.id,
					invoiceId: paid.id,
					description: 'Telehealth visit',
					amountCents: 8000,
				});
			}
		}

		const todayPatient = await patients.findOne({
			where: {practiceId: practice.id, email: TODAY_OFFICE_PATIENT_EMAIL},
		});
		if (todayPatient) {
			const todayWindow = secondTodayAppointmentWindow(now, telehealthStart, telehealthEnd);
			await upsertAppointmentByNotes(appointments, {
				practiceId: practice.id,
				providerId: provider.id,
				patientId: todayPatient.id,
				notes: TODAY_OFFICE_NOTES,
				type: 'office_visit',
				startAt: todayWindow.startAt,
				endAt: todayWindow.endAt,
				refresh: true,
			});
		}

		for (const [index, slot] of EXTRA_FUTURE_APPOINTMENTS.entries()) {
			await parkAppointmentByNotes(appointments, practice.id, slot.notes, now, 50 + index);
		}

		for (const slot of EXTRA_FUTURE_APPOINTMENTS) {
			const patient = await patients.findOne({
				where: {practiceId: practice.id, email: slot.patientEmail},
			});
			if (!patient) {
				continue;
			}
			const window = futureAppointmentWindow(now, slot.daysFromNow);
			await upsertAppointmentByNotes(appointments, {
				practiceId: practice.id,
				providerId: provider.id,
				patientId: patient.id,
				notes: slot.notes,
				type: slot.type,
				startAt: window.startAt,
				endAt: window.endAt,
				refresh: true,
			});
		}

		for (const [index, catalog] of SEEDED_CURRENT_MONTH_INVOICES.entries()) {
			const patient = await patients.findOne({
				where: {practiceId: practice.id, email: catalog.patientEmail},
			});
			if (!patient) {
				continue;
			}
			const issuedAt = currentMonthIssuedAt(now, index);
			const dueAt = new Date(issuedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
			const existingLine = await lineItemRows.findOne({
				where: {practiceId: practice.id, description: catalog.description},
			});
			if (existingLine) {
				const invoice = await invoiceRows.findOne({where: {id: existingLine.invoiceId}});
				if (invoice) {
					invoice.patientId = patient.id;
					invoice.status = catalog.status;
					invoice.amountCents = catalog.amountCents;
					invoice.issuedAt = issuedAt;
					invoice.dueAt = dueAt;
					invoice.synthetic = true;
					await invoiceRows.save(invoice);
					existingLine.amountCents = catalog.amountCents;
					await lineItemRows.save(existingLine);
				}
				continue;
			}
			const invoice = await invoiceRows.save({
				practiceId: practice.id,
				patientId: patient.id,
				status: catalog.status,
				amountCents: catalog.amountCents,
				currency: 'USD',
				issuedAt,
				dueAt,
				synthetic: true,
			});
			await lineItemRows.save({
				practiceId: practice.id,
				invoiceId: invoice.id,
				description: catalog.description,
				amountCents: catalog.amountCents,
			});
		}

		for (const item of SEEDED_INBOX_ITEMS) {
			const recipientUserId = item.recipient === 'admin' ? admin.id : provider.id;
			const existing = await notificationRows.findOne({
				where: {
					practiceId: practice.id,
					recipientUserId,
					channel: 'in_app',
					title: item.title,
				},
			});
			if (existing) {
				continue;
			}
			await notificationRows.save({
				practiceId: practice.id,
				recipientUserId,
				channel: 'in_app',
				type: 'generic',
				title: item.title,
				body: item.body,
				status: 'delivered',
				attemptCount: 1,
				lastAttemptAt: now,
				deliveredAt: now,
				readAt: null,
				synthetic: true,
			});
		}

		Logger.log(
			`Seeded synthetic practice admin, provider ${provider.id}, MFA nurse ${mfaNurse.id}, demo patients, appointments, an in-window telehealth visit, clinical rows, a document, invoices, and inbox rows`,
			'MockIdentity',
		);
	} finally {
		if (dataSource.isInitialized) {
			await dataSource.destroy();
		}
	}
}

function isCliEntrypoint(): boolean {
	const entry = process.argv[1];
	if (!entry) {
		return false;
	}
	return basename(entry).replace(/\.ts$/, '.js') === 'seed-mock-identity.js';
}

if (isCliEntrypoint()) {
	seedMockIdentity().catch((error: unknown) => {
		Logger.error(safeError(error), 'MockIdentity');
		process.exitCode = 1;
	});
}
