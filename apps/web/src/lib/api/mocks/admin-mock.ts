import {fixtureAdminUsers, fixtureAuditEvents} from '@/lib/api/mocks/fixtures';
import {mockDelay, mockLog, shouldSimulateError} from '@/lib/api/mocks/runtime';
import type {AuditEvent} from '@/types/admin/audit-event';
import type {PracticeUser} from '@/types/admin/practice-user';

const users: PracticeUser[] = structuredClone(fixtureAdminUsers);
const events: AuditEvent[] = structuredClone(fixtureAuditEvents);

async function withMock<T>(work: () => T, errorMessage: string): Promise<T> {
	await mockDelay();
	if (shouldSimulateError()) {
		mockLog('warn', errorMessage);
		throw new Error(errorMessage);
	}
	return work();
}

export const adminMockAPI = {
	listUsers: async (): Promise<PracticeUser[]> =>
		withMock(() => users, 'Mock: Failed to load practice users'),

	listAuditEvents: async (): Promise<AuditEvent[]> =>
		withMock(() => events, 'Mock: Failed to load audit events'),
};
