import type {AppointmentType} from '../persistence/entities/appointment.entity.js';
import type {InvoicePersistedStatus} from '../persistence/entities/invoice.entity.js';
import type {PatientGender, PatientStatus} from '../persistence/entities/patient.entity.js';

export type SeededPatientDemographics = {
	firstName: string;
	lastName: string;
	dateOfBirth: string;
	gender: PatientGender;
	status: PatientStatus;
	phone: string;
	email: string;
	street: string;
	city: string;
	state: string;
	postalCode: string;
	emergencyContactName: string;
	emergencyContactRelationship: string;
	emergencyContactPhone: string;
	insuranceProvider: string;
	insurancePolicyNumber: string;
	insuranceGroupNumber: string;
};

export type SeededFutureAppointment = {
	notes: string;
	patientEmail: string;
	type: AppointmentType;
	daysFromNow: number;
};

export type SeededCurrentMonthInvoice = {
	description: string;
	patientEmail: string;
	status: InvoicePersistedStatus;
	amountCents: number;
};

export type SeededInboxItem = {
	recipient: 'admin' | 'provider';
	title: string;
	body: string;
};

export const TODAY_OFFICE_NOTES = 'Seeded today office visit';
export const TODAY_OFFICE_PATIENT_EMAIL = 'casey.reed@synthetic.example';

const HARBOR = {
	city: 'Harborview',
	state: 'WA',
	postalCode: '98101',
	insuranceProvider: 'Synthetic Health Plan',
	insuranceGroupNumber: 'GRP-1',
	status: 'active' as const,
	emergencyContactRelationship: 'Sibling',
};

function extraPatient(
	overrides: Pick<
		SeededPatientDemographics,
		| 'firstName'
		| 'lastName'
		| 'dateOfBirth'
		| 'gender'
		| 'phone'
		| 'email'
		| 'street'
		| 'emergencyContactName'
		| 'emergencyContactPhone'
		| 'insurancePolicyNumber'
	>,
): SeededPatientDemographics {
	return {
		...HARBOR,
		...overrides,
	};
}

/**
 * Eighteen extra Harbor patients. Last names sort after Quinn so Avery Quinn and Blake Chen
 * stay on patient-list page 1 (`lastName ASC`, page size 10).
 */
export const EXTRA_SEEDED_PATIENTS: readonly SeededPatientDemographics[] = [
	extraPatient({
		firstName: 'Casey',
		lastName: 'Reed',
		dateOfBirth: '1985-03-18',
		gender: 'non-binary',
		phone: '555-0200',
		email: TODAY_OFFICE_PATIENT_EMAIL,
		street: '300 Demo Street',
		emergencyContactName: 'Robin Reed',
		emergencyContactPhone: '555-0201',
		insurancePolicyNumber: 'SYN-300',
	}),
	extraPatient({
		firstName: 'Dana',
		lastName: 'Reyes',
		dateOfBirth: '1979-07-22',
		gender: 'female',
		phone: '555-0202',
		email: 'dana.reyes@synthetic.example',
		street: '310 Demo Street',
		emergencyContactName: 'Sam Reyes',
		emergencyContactPhone: '555-0203',
		insurancePolicyNumber: 'SYN-301',
	}),
	extraPatient({
		firstName: 'Ellis',
		lastName: 'Rivera',
		dateOfBirth: '1994-01-09',
		gender: 'male',
		phone: '555-0204',
		email: 'ellis.rivera@synthetic.example',
		street: '320 Demo Street',
		emergencyContactName: 'Pat Rivera',
		emergencyContactPhone: '555-0205',
		insurancePolicyNumber: 'SYN-302',
	}),
	extraPatient({
		firstName: 'Finley',
		lastName: 'Rowe',
		dateOfBirth: '1990-12-14',
		gender: 'female',
		phone: '555-0206',
		email: 'finley.rowe@synthetic.example',
		street: '330 Demo Street',
		emergencyContactName: 'Jamie Rowe',
		emergencyContactPhone: '555-0207',
		insurancePolicyNumber: 'SYN-303',
	}),
	extraPatient({
		firstName: 'Greer',
		lastName: 'Santos',
		dateOfBirth: '1982-05-30',
		gender: 'male',
		phone: '555-0208',
		email: 'greer.santos@synthetic.example',
		street: '340 Demo Street',
		emergencyContactName: 'Alex Santos',
		emergencyContactPhone: '555-0209',
		insurancePolicyNumber: 'SYN-304',
	}),
	extraPatient({
		firstName: 'Harper',
		lastName: 'Sato',
		dateOfBirth: '1996-08-04',
		gender: 'female',
		phone: '555-0210',
		email: 'harper.sato@synthetic.example',
		street: '350 Demo Street',
		emergencyContactName: 'Kai Sato',
		emergencyContactPhone: '555-0211',
		insurancePolicyNumber: 'SYN-305',
	}),
	extraPatient({
		firstName: 'Indigo',
		lastName: 'Sutton',
		dateOfBirth: '1987-02-11',
		gender: 'non-binary',
		phone: '555-0212',
		email: 'indigo.sutton@synthetic.example',
		street: '360 Demo Street',
		emergencyContactName: 'Drew Sutton',
		emergencyContactPhone: '555-0213',
		insurancePolicyNumber: 'SYN-306',
	}),
	extraPatient({
		firstName: 'Jules',
		lastName: 'Tate',
		dateOfBirth: '1991-09-27',
		gender: 'male',
		phone: '555-0214',
		email: 'jules.tate@synthetic.example',
		street: '370 Demo Street',
		emergencyContactName: 'Riley Tate',
		emergencyContactPhone: '555-0215',
		insurancePolicyNumber: 'SYN-307',
	}),
	extraPatient({
		firstName: 'Kai',
		lastName: 'Turner',
		dateOfBirth: '1983-11-08',
		gender: 'male',
		phone: '555-0216',
		email: 'kai.turner@synthetic.example',
		street: '380 Demo Street',
		emergencyContactName: 'Morgan Turner',
		emergencyContactPhone: '555-0217',
		insurancePolicyNumber: 'SYN-308',
	}),
	extraPatient({
		firstName: 'Logan',
		lastName: 'Upton',
		dateOfBirth: '1976-04-19',
		gender: 'female',
		phone: '555-0218',
		email: 'logan.upton@synthetic.example',
		street: '390 Demo Street',
		emergencyContactName: 'Chris Upton',
		emergencyContactPhone: '555-0219',
		insurancePolicyNumber: 'SYN-309',
	}),
	extraPatient({
		firstName: 'Morgan',
		lastName: 'Vargas',
		dateOfBirth: '1998-06-02',
		gender: 'non-binary',
		phone: '555-0220',
		email: 'morgan.vargas@synthetic.example',
		street: '400 Demo Street',
		emergencyContactName: 'Taylor Vargas',
		emergencyContactPhone: '555-0221',
		insurancePolicyNumber: 'SYN-310',
	}),
	extraPatient({
		firstName: 'Noor',
		lastName: 'Vaughn',
		dateOfBirth: '1989-10-21',
		gender: 'female',
		phone: '555-0222',
		email: 'noor.vaughn@synthetic.example',
		street: '410 Demo Street',
		emergencyContactName: 'Jordan Vaughn',
		emergencyContactPhone: '555-0223',
		insurancePolicyNumber: 'SYN-311',
	}),
	extraPatient({
		firstName: 'Oakley',
		lastName: 'Walsh',
		dateOfBirth: '1993-03-07',
		gender: 'male',
		phone: '555-0224',
		email: 'oakley.walsh@synthetic.example',
		street: '420 Demo Street',
		emergencyContactName: 'Quinn Walsh',
		emergencyContactPhone: '555-0225',
		insurancePolicyNumber: 'SYN-312',
	}),
	extraPatient({
		firstName: 'Parker',
		lastName: 'West',
		dateOfBirth: '1980-12-29',
		gender: 'female',
		phone: '555-0226',
		email: 'parker.west@synthetic.example',
		street: '430 Demo Street',
		emergencyContactName: 'Reese West',
		emergencyContactPhone: '555-0227',
		insurancePolicyNumber: 'SYN-313',
	}),
	extraPatient({
		firstName: 'Rowan',
		lastName: 'Yamamoto',
		dateOfBirth: '1986-01-15',
		gender: 'male',
		phone: '555-0228',
		email: 'rowan.yamamoto@synthetic.example',
		street: '440 Demo Street',
		emergencyContactName: 'Sasha Yamamoto',
		emergencyContactPhone: '555-0229',
		insurancePolicyNumber: 'SYN-314',
	}),
	extraPatient({
		firstName: 'Sage',
		lastName: 'Young',
		dateOfBirth: '1995-05-06',
		gender: 'non-binary',
		phone: '555-0230',
		email: 'sage.young@synthetic.example',
		street: '450 Demo Street',
		emergencyContactName: 'Blair Young',
		emergencyContactPhone: '555-0231',
		insurancePolicyNumber: 'SYN-315',
	}),
	extraPatient({
		firstName: 'Tatum',
		lastName: 'Zheng',
		dateOfBirth: '1978-08-16',
		gender: 'female',
		phone: '555-0232',
		email: 'tatum.zheng@synthetic.example',
		street: '460 Demo Street',
		emergencyContactName: 'Cameron Zheng',
		emergencyContactPhone: '555-0233',
		insurancePolicyNumber: 'SYN-316',
	}),
	extraPatient({
		firstName: 'Uma',
		lastName: 'Zimmerman',
		dateOfBirth: '1992-02-25',
		gender: 'female',
		phone: '555-0234',
		email: 'uma.zimmerman@synthetic.example',
		street: '470 Demo Street',
		emergencyContactName: 'Devon Zimmerman',
		emergencyContactPhone: '555-0235',
		insurancePolicyNumber: 'SYN-317',
	}),
];

export const EXTRA_FUTURE_APPOINTMENTS: readonly SeededFutureAppointment[] = [
	{
		notes: 'Seeded follow-up +14d',
		patientEmail: 'dana.reyes@synthetic.example',
		type: 'follow_up',
		daysFromNow: 14,
	},
	{
		notes: 'Seeded office visit +15d',
		patientEmail: 'ellis.rivera@synthetic.example',
		type: 'office_visit',
		daysFromNow: 15,
	},
	{
		notes: 'Seeded follow-up +16d',
		patientEmail: 'finley.rowe@synthetic.example',
		type: 'follow_up',
		daysFromNow: 16,
	},
	{
		notes: 'Seeded office visit +17d',
		patientEmail: 'greer.santos@synthetic.example',
		type: 'office_visit',
		daysFromNow: 17,
	},
	{
		notes: 'Seeded follow-up +18d',
		patientEmail: 'harper.sato@synthetic.example',
		type: 'follow_up',
		daysFromNow: 18,
	},
];

export const SEEDED_CURRENT_MONTH_INVOICES: readonly SeededCurrentMonthInvoice[] = [
	{
		description: 'Seeded current-month office visit',
		patientEmail: 'casey.reed@synthetic.example',
		status: 'issued',
		amountCents: 12000,
	},
	{
		description: 'Seeded current-month telehealth visit',
		patientEmail: 'dana.reyes@synthetic.example',
		status: 'paid',
		amountCents: 9000,
	},
	{
		description: 'Seeded current-month follow-up',
		patientEmail: 'ellis.rivera@synthetic.example',
		status: 'issued',
		amountCents: 15000,
	},
	{
		description: 'Seeded current-month labs',
		patientEmail: 'finley.rowe@synthetic.example',
		status: 'paid',
		amountCents: 11000,
	},
];

export const SEEDED_INBOX_ITEMS: readonly SeededInboxItem[] = [
	{
		recipient: 'admin',
		title: 'Seeded inbox: census reminder',
		body: 'Harbor Synthetic Practice has new demo patients ready for the overview cards.',
	},
	{
		recipient: 'admin',
		title: 'Seeded inbox: schedule digest',
		body: 'Today’s seeded office visit is on the calendar for the live dashboard.',
	},
	{
		recipient: 'admin',
		title: 'Seeded inbox: billing summary',
		body: 'Current-month demo invoices are posted so monthly revenue is non-zero.',
	},
	{
		recipient: 'provider',
		title: 'Seeded inbox: today\'s visits',
		body: 'A live telehealth window and a same-day office visit are on your schedule.',
	},
	{
		recipient: 'provider',
		title: 'Seeded inbox: follow-up queue',
		body: 'Upcoming seeded follow-ups are assigned to Jordan Ellis.',
	},
];

export function utcDateKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export function secondTodayAppointmentWindow(
	now: Date,
	telehealthStart: Date,
	telehealthEnd: Date,
): {startAt: Date; endAt: Date} {
	const today = utcDateKey(now);
	const hourMs = 60 * 60 * 1000;
	const afterStart = new Date(telehealthEnd.getTime());
	if (utcDateKey(afterStart) === today) {
		return {startAt: afterStart, endAt: new Date(afterStart.getTime() + hourMs)};
	}
	const beforeEnd = new Date(telehealthStart.getTime());
	const beforeStart = new Date(beforeEnd.getTime() - hourMs);
	if (utcDateKey(beforeStart) === today) {
		return {startAt: beforeStart, endAt: beforeEnd};
	}
	const noon = new Date(`${today}T12:00:00.000Z`);
	const noonEnd = new Date(noon.getTime() + hourMs);
	const overlaps = noon < telehealthEnd && telehealthStart < noonEnd;
	if (!overlaps) {
		return {startAt: noon, endAt: noonEnd};
	}
	return {startAt: afterStart, endAt: new Date(afterStart.getTime() + hourMs)};
}

export function futureAppointmentWindow(now: Date, daysFromNow: number): {startAt: Date; endAt: Date} {
	const shifted = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
	const startAt = new Date(`${utcDateKey(shifted)}T16:00:00.000Z`);
	return {startAt, endAt: new Date(startAt.getTime() + 60 * 60 * 1000)};
}

export function currentMonthIssuedAt(now: Date, dayOffset: number): Date {
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1 + dayOffset, 12, 0, 0));
}
