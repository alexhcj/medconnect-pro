import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {DataSource} from 'typeorm';
import {
	DEMO_EMAIL,
	PRACTICE_NAME,
	PROVIDER_EMAIL,
	seedMockIdentity,
} from '../src/identity/seed-mock-identity.js';
import {utcDateKey} from '../src/identity/seed-mock-identity-corpus.js';
import {Appointment} from '../src/persistence/entities/appointment.entity.js';
import {Invoice} from '../src/persistence/entities/invoice.entity.js';
import {Notification} from '../src/persistence/entities/notification.entity.js';
import {Patient} from '../src/persistence/entities/patient.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {createAdminDataSource} from './admin-data-source.js';

type HarborSnapshot = {
	patientCount: number;
	patientEmails: string[];
	appointmentCount: number;
	todayAppointmentCount: number;
	currentMonthInvoiceCount: number;
	adminInboxCount: number;
	providerInboxCount: number;
	nonSyntheticPatients: number;
	nonSyntheticAppointments: number;
	nonSyntheticInvoices: number;
	nonSyntheticNotifications: number;
};

describe('seed:mock-identity bounded corpus', () => {
	let dataSource: DataSource;

	beforeAll(async () => {
		dataSource = await createAdminDataSource();
	});

	afterAll(async () => {
		if (dataSource?.isInitialized) {
			await dataSource.destroy();
		}
	});

	async function snapshot(): Promise<HarborSnapshot> {
		const practice = await dataSource.getRepository(Practice).findOne({
			where: {name: PRACTICE_NAME},
		});
		expect(practice).toBeTruthy();
		const practiceId = practice!.id;
		const now = new Date();
		const today = utcDateKey(now);
		const monthPrefix = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

		const admin = await dataSource.getRepository(User).findOne({where: {email: DEMO_EMAIL}});
		const provider = await dataSource.getRepository(User).findOne({
			where: {email: PROVIDER_EMAIL},
		});
		expect(admin).toBeTruthy();
		expect(provider).toBeTruthy();

		const patientRows = await dataSource.getRepository(Patient).find({where: {practiceId}});
		const appointmentRows = await dataSource.getRepository(Appointment).find({where: {practiceId}});
		const invoiceRows = await dataSource.getRepository(Invoice).find({where: {practiceId}});
		const notificationRows = await dataSource.getRepository(Notification).find({
			where: {practiceId, channel: 'in_app'},
		});

		return {
			patientCount: patientRows.length,
			patientEmails: patientRows.map((row) => row.email).sort(),
			appointmentCount: appointmentRows.length,
			todayAppointmentCount: appointmentRows.filter(
				(row) => utcDateKey(row.startAt) === today,
			).length,
			currentMonthInvoiceCount: invoiceRows.filter((row) =>
				row.issuedAt.toISOString().startsWith(monthPrefix),
			).length,
			adminInboxCount: notificationRows.filter((row) => row.recipientUserId === admin!.id)
				.length,
			providerInboxCount: notificationRows.filter(
				(row) => row.recipientUserId === provider!.id,
			).length,
			nonSyntheticPatients: patientRows.filter((row) => !row.synthetic).length,
			nonSyntheticAppointments: appointmentRows.filter((row) => !row.synthetic).length,
			nonSyntheticInvoices: invoiceRows.filter((row) => !row.synthetic).length,
			nonSyntheticNotifications: notificationRows.filter((row) => !row.synthetic).length,
		};
	}

	it('meets Harbor minima and does not grow on a second run', async () => {
		await seedMockIdentity();
		const first = await snapshot();

		expect(first.patientCount).toBeGreaterThanOrEqual(20);
		expect(first.appointmentCount).toBeGreaterThanOrEqual(8);
		expect(first.todayAppointmentCount).toBeGreaterThanOrEqual(2);
		expect(first.currentMonthInvoiceCount).toBeGreaterThanOrEqual(4);
		expect(first.adminInboxCount).toBeGreaterThanOrEqual(3);
		expect(first.providerInboxCount).toBeGreaterThanOrEqual(2);
		expect(first.patientEmails).toContain('avery.quinn@synthetic.example');
		expect(first.patientEmails).toContain('blake.chen@synthetic.example');
		expect(new Set(first.patientEmails).size).toBe(first.patientEmails.length);
		expect(first.nonSyntheticPatients).toBe(0);
		expect(first.nonSyntheticAppointments).toBe(0);
		expect(first.nonSyntheticInvoices).toBe(0);
		expect(first.nonSyntheticNotifications).toBe(0);

		await seedMockIdentity();
		const second = await snapshot();

		expect(second.patientCount).toBe(first.patientCount);
		expect(second.appointmentCount).toBe(first.appointmentCount);
		expect(second.todayAppointmentCount).toBeGreaterThanOrEqual(2);
		expect(second.currentMonthInvoiceCount).toBe(first.currentMonthInvoiceCount);
		expect(second.adminInboxCount).toBe(first.adminInboxCount);
		expect(second.providerInboxCount).toBe(first.providerInboxCount);
		expect(second.patientEmails).toEqual(first.patientEmails);
	});
});
