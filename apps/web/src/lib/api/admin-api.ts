import {
	auditEventFromRdo,
	practiceUserFromRdo,
	type AuditEventSearchResultRdo,
	type PracticeUserListRdo,
	type PracticeUserRdo,
} from '@/lib/api/admin-rdo';
import {apiFetch} from '@/lib/api/http';
import {adminMockAPI} from '@/lib/api/mocks/admin-mock';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {nestApiBaseUrl} from '@/lib/api/nest-api';
import type {AuditEvent} from '@/types/admin/audit-event';
import type {PracticeUser} from '@/types/admin/practice-user';
import type {Role} from '@/types/auth/roles';

function adminUsersUrl(): string {
	return `${nestApiBaseUrl()}/admin/users`;
}

function adminAuditEventsUrl(): string {
	return `${nestApiBaseUrl()}/admin/audit-events`;
}

function adminUserRolesUrl(userId: string): string {
	return `${adminUsersUrl()}/${userId}/roles`;
}

export const adminRealAPI = {
	listUsers: async (): Promise<PracticeUser[]> => {
		const result = await apiFetch<PracticeUserListRdo>(adminUsersUrl());
		return result.users.map(practiceUserFromRdo);
	},
	listAuditEvents: async (): Promise<AuditEvent[]> => {
		const result = await apiFetch<AuditEventSearchResultRdo>(adminAuditEventsUrl());
		return result.events.map(auditEventFromRdo);
	},
	assignRole: async (userId: string, role: Role): Promise<PracticeUser> => {
		const rdo = await apiFetch<PracticeUserRdo>(adminUserRolesUrl(userId), {
			method: 'PATCH',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({role}),
		});
		return practiceUserFromRdo(rdo);
	},
};

export const adminAPI = isMockMode() ? adminMockAPI : adminRealAPI;
