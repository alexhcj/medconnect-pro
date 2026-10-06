import {ApiError} from '@/lib/api/http';
import {fixtureAdminUsers, fixtureAuditEvents} from '@/lib/api/mocks/fixtures';
import {readMockSession} from '@/lib/api/mocks/mock-session-store';
import {mockDelay, mockLog, shouldSimulateError} from '@/lib/api/mocks/runtime';
import type {AuditEvent} from '@/types/admin/audit-event';
import type {PracticeUser} from '@/types/admin/practice-user';
import {isRole, type Role} from '@/types/auth/roles';

const FORBIDDEN_MESSAGE = 'You do not have permission to perform this action';

let users: PracticeUser[] = structuredClone(fixtureAdminUsers);
let events: AuditEvent[] = structuredClone(fixtureAuditEvents);

export function resetAdminMock(): void {
	users = structuredClone(fixtureAdminUsers);
	events = structuredClone(fixtureAuditEvents);
}

async function withMock<T>(work: () => T, errorMessage: string): Promise<T> {
	await mockDelay();
	if (shouldSimulateError()) {
		mockLog('warn', errorMessage);
		throw new Error(errorMessage);
	}
	return work();
}

function forbidden(): never {
	throw new ApiError(FORBIDDEN_MESSAGE, 403, {code: 'FORBIDDEN'});
}

function notFound(): never {
	throw new ApiError('Resource not found', 404, {code: 'NOT_FOUND'});
}

function recordRoleChanged(userId: string, practiceId: string): void {
	const eventId = `demo-audit-role-${crypto.randomUUID()}`;
	events.unshift({
		id: eventId,
		practiceId,
		actorUserId: readMockSession()?.userId ?? 'user_mock_practice_admin',
		action: 'membership.role_changed',
		resourceType: 'user',
		resourceId: userId,
		correlationId: `demo-correlation-role-${crypto.randomUUID()}`,
		createdAt: new Date().toISOString(),
	});
}

export const adminMockAPI = {
	listUsers: async (): Promise<PracticeUser[]> =>
		withMock(() => users.map((user) => ({...user})), 'Mock: Failed to load practice users'),

	listAuditEvents: async (): Promise<AuditEvent[]> =>
		withMock(() => events.map((event) => ({...event})), 'Mock: Failed to load audit events'),

	assignRole: async (userId: string, role: Role): Promise<PracticeUser> =>
		withMock(() => {
			if (!isRole(role)) {
				throw new ApiError('Request validation failed', 400, {code: 'VALIDATION_ERROR'});
			}

			const row = users.find((user) => user.id === userId);
			if (!row) {
				notFound();
			}

			const actorRole = readMockSession()?.userRole;
			if (actorRole !== 'SUPER_ADMIN' && role === 'SUPER_ADMIN') {
				forbidden();
			}
			if (row.role === 'PRACTICE_ADMIN' && role !== 'PRACTICE_ADMIN') {
				const adminCount = users.filter((user) => user.role === 'PRACTICE_ADMIN').length;
				if (adminCount === 1) {
					forbidden();
				}
			}
			if (row.role === role) {
				return {...row};
			}

			row.role = role;
			recordRoleChanged(userId, row.practiceId);
			return {...row};
		}, 'Mock: Failed to assign role'),
};
