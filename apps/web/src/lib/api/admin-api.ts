import {
	auditEventFromRdo,
	practiceUserFromRdo,
	type AuditEventSearchResultRdo,
	type PracticeUserListRdo,
	type PracticeUserRdo,
} from '@/lib/api/admin-rdo';
import {apiFetch} from '@/lib/api/http';
import {eventListQuery, userListQuery} from '@/lib/admin/list-params';
import {adminMockAPI} from '@/lib/api/mocks/admin-mock';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {nestApiBaseUrl} from '@/lib/api/nest-api';
import type {EventListParams, PagedResult, UserListParams} from '@/types/admin/admin-list';
import type {AuditEvent} from '@/types/admin/audit-event';
import type {PracticeUser} from '@/types/admin/practice-user';
import type {Role} from '@/types/auth/roles';

function adminUsersUrl(): string {
	return `${nestApiBaseUrl()}/admin/users`;
}

function adminAuditEventsUrl(): string {
	return `${nestApiBaseUrl()}/admin/audit-events`;
}

function adminSecurityEventsUrl(): string {
	return `${nestApiBaseUrl()}/admin/security-events`;
}

function adminUserRolesUrl(userId: string): string {
	return `${adminUsersUrl()}/${userId}/roles`;
}

function pagedEvents(result: AuditEventSearchResultRdo): PagedResult<AuditEvent> {
	return {
		items: result.events.map(auditEventFromRdo),
		total: result.total,
		hasMore: result.hasMore,
		nextPage: result.nextPage,
	};
}

export const adminRealAPI = {
	listUsers: async (params: UserListParams = {page: 1}): Promise<PagedResult<PracticeUser>> => {
		const result = await apiFetch<PracticeUserListRdo>(
			`${adminUsersUrl()}?${userListQuery(params)}`,
		);
		return {
			items: result.users.map(practiceUserFromRdo),
			total: result.total,
			hasMore: result.hasMore,
			nextPage: result.nextPage,
		};
	},
	listAuditEvents: async (
		params: EventListParams = {page: 1},
	): Promise<PagedResult<AuditEvent>> =>
		pagedEvents(
			await apiFetch<AuditEventSearchResultRdo>(
				`${adminAuditEventsUrl()}?${eventListQuery(params)}`,
			),
		),
	listSecurityEvents: async (
		params: EventListParams = {page: 1},
	): Promise<PagedResult<AuditEvent>> =>
		pagedEvents(
			await apiFetch<AuditEventSearchResultRdo>(
				`${adminSecurityEventsUrl()}?${eventListQuery(params)}`,
			),
		),
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
