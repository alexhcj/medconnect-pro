import {adminMockAPI} from '@/lib/api/mocks/admin-mock';

describe('adminMockAPI', () => {
	it('lists synthetic practice users with catalog roles and no passwords', async () => {
		const users = await adminMockAPI.listUsers();

		expect(users.length).toBeGreaterThan(0);
		expect(users.map((user) => user.role)).toEqual([
			'SUPER_ADMIN',
			'PRACTICE_ADMIN',
			'PROVIDER',
			'NURSE',
			'RECEPTIONIST',
			'PATIENT',
		]);
		expect(users[1]).toEqual(
			expect.objectContaining({
				id: 'user_mock_practice_admin',
				email: 'practice.admin@example.test',
				role: 'PRACTICE_ADMIN',
				practiceId: 'demo-practice-001',
				synthetic: true,
			}),
		);
		expect(users.every((user) => !('password' in user))).toBe(true);
	});

	it('lists synthetic audit events with metadata only', async () => {
		const events = await adminMockAPI.listAuditEvents();

		expect(events.length).toBeGreaterThan(0);
		expect(events[0]).toEqual(
			expect.objectContaining({
				id: 'demo-audit-001',
				practiceId: 'demo-practice-001',
				actorUserId: 'user_mock_practice_admin',
				action: 'auth.login.succeeded',
				resourceType: 'session',
				resourceId: null,
				correlationId: 'demo-correlation-001',
				createdAt: '2026-09-26T14:00:00.000Z',
			}),
		);
		expect(events.some((event) => event.action === 'patient.accessed')).toBe(true);
		expect(events.some((event) => event.action === 'access.denied')).toBe(true);
		expect(JSON.stringify(events)).not.toMatch(/password|@example\.test/i);
	});
});
