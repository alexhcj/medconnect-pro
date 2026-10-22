import {
	API_AUDIT_ACTIONS,
	AUDIT_ACTION_OPTIONS,
	SECURITY_ACTION_OPTIONS,
} from '@/lib/admin/event-filter-options';
import {fixtureAuditEvents, fixtureSecurityEvents} from '@/lib/api/mocks/fixtures';

const known = new Set<string>(API_AUDIT_ACTIONS);

describe('event filter options', () => {
	it('declares each API action once, sorted', () => {
		expect(known.size).toBe(API_AUDIT_ACTIONS.length);
		expect([...API_AUDIT_ACTIONS]).toEqual([...API_AUDIT_ACTIONS].sort());
	});

	it('offers every declared action on the audit list', () => {
		expect([...AUDIT_ACTION_OPTIONS]).toEqual([...API_AUDIT_ACTIONS]);
	});

	it('offers exactly the auth.* actions on the security list', () => {
		expect([...SECURITY_ACTION_OPTIONS]).toEqual(API_AUDIT_ACTIONS.filter((a) => a.startsWith('auth.')));
		expect(SECURITY_ACTION_OPTIONS).toEqual(
			expect.arrayContaining(['auth.mfa.failed', 'auth.logout_all', 'auth.refresh.reuse', 'auth.session.revoked']),
		);
	});

	it('does not offer the mock-only invoice.viewed', () => {
		expect(known.has('invoice.viewed')).toBe(false);
	});

	it('keeps fixture events inside the declared set', () => {
		for (const event of [...fixtureAuditEvents, ...fixtureSecurityEvents]) {
			expect(known.has(event.action)).toBe(true);
		}
	});
});
