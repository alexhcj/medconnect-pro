import {describe, expect, it} from 'vitest';
import {
	currentMonthIssuedAt,
	futureAppointmentWindow,
	secondTodayAppointmentWindow,
	SEEDED_AUDIT_EVENTS,
	SEEDED_AUTH_ACTIONS,
	SEEDED_OTHER_ACTIONS,
	SEEDED_PAGING_INVOICES,
	SEEDED_STAFF_USERS,
	seededAuditCreatedAt,
	utcDateKey,
} from './seed-mock-identity-corpus.js';
import {defaultMockIdpAccounts} from './mock-idp.js';

describe('DATA-006 paging corpus', () => {
	it('keeps staff users synthetic, unique, role-limited and without mock IdP logins', () => {
		expect(SEEDED_STAFF_USERS).toHaveLength(24);
		const emails = SEEDED_STAFF_USERS.map((user) => user.email);
		expect(new Set(emails).size).toBe(emails.length);
		const idpEmails = new Set(defaultMockIdpAccounts.map((account) => account.email));
		for (const user of SEEDED_STAFF_USERS) {
			expect(user.email.endsWith('@synthetic.example')).toBe(true);
			expect(['NURSE', 'RECEPTIONIST']).toContain(user.role);
			expect(idpEmails.has(user.email)).toBe(false);
		}
	});

	it('seeds older, unique invoices that never belong to Avery Quinn', () => {
		expect(SEEDED_PAGING_INVOICES).toHaveLength(8);
		const descriptions = SEEDED_PAGING_INVOICES.map((invoice) => invoice.description);
		expect(new Set(descriptions).size).toBe(descriptions.length);
		for (const invoice of SEEDED_PAGING_INVOICES) {
			expect(invoice.patientEmail).not.toBe('avery.quinn@synthetic.example');
			expect(invoice.issuedAt.getTime()).toBeLessThan(Date.parse('2026-08-10T00:00:00.000Z'));
		}
	});

	it('seeds 45 audit rows with stable ids, known actions and a past spread', () => {
		expect(SEEDED_AUDIT_EVENTS).toHaveLength(45);
		expect(new Set(SEEDED_AUDIT_EVENTS.map((event) => event.id)).size).toBe(45);
		const known = new Set<string>([
			...SEEDED_AUTH_ACTIONS,
			...SEEDED_OTHER_ACTIONS.map((entry) => entry.action),
		]);
		for (const event of SEEDED_AUDIT_EVENTS) {
			expect(known.has(event.action)).toBe(true);
			expect(event.correlationId.startsWith('seed-audit-')).toBe(true);
		}
		expect(SEEDED_AUDIT_EVENTS.filter((event) => event.action.startsWith('auth.')).length).toBe(30);
		const now = new Date('2026-10-22T12:00:00.000Z');
		const times = SEEDED_AUDIT_EVENTS.map((event) => seededAuditCreatedAt(now, event.hoursAgo).getTime());
		expect(Math.max(...times)).toBeLessThan(now.getTime());
		expect(new Set(times).size).toBe(45);
	});
});

describe('seed mock identity corpus windows', () => {
	it('places the second today slot after the telehealth window when that stays on the UTC date', () => {
		const now = new Date('2026-10-04T15:00:00.000Z');
		const telehealthStart = new Date('2026-10-04T14:58:00.000Z');
		const telehealthEnd = new Date('2026-10-04T15:45:00.000Z');
		const window = secondTodayAppointmentWindow(now, telehealthStart, telehealthEnd);
		expect(utcDateKey(window.startAt)).toBe('2026-10-04');
		expect(window.startAt.toISOString()).toBe('2026-10-04T15:45:00.000Z');
		expect(window.endAt.toISOString()).toBe('2026-10-04T16:45:00.000Z');
	});

	it('places the second today slot before telehealth when after would leave the UTC date', () => {
		const now = new Date('2026-10-04T23:50:00.000Z');
		const telehealthStart = new Date('2026-10-04T23:48:00.000Z');
		const telehealthEnd = new Date('2026-10-05T00:33:00.000Z');
		const window = secondTodayAppointmentWindow(now, telehealthStart, telehealthEnd);
		expect(utcDateKey(window.startAt)).toBe('2026-10-04');
		expect(window.startAt.toISOString()).toBe('2026-10-04T22:48:00.000Z');
		expect(window.endAt.toISOString()).toBe('2026-10-04T23:48:00.000Z');
	});

	it('pins future slots to 16:00 UTC on the shifted date', () => {
		const window = futureAppointmentWindow(new Date('2026-10-04T09:10:00.000Z'), 14);
		expect(window.startAt.toISOString()).toBe('2026-10-18T16:00:00.000Z');
		expect(window.endAt.toISOString()).toBe('2026-10-18T17:00:00.000Z');
	});

	it('issues current-month invoices on UTC month day offsets', () => {
		const issued = currentMonthIssuedAt(new Date('2026-10-04T18:00:00.000Z'), 2);
		expect(issued.toISOString()).toBe('2026-10-03T12:00:00.000Z');
	});
});
