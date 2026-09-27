import {ApiError} from '@/lib/api/http';
import {adminMockAPI} from '@/lib/api/mocks/admin-mock';
import {isMockMode} from '@/lib/api/mocks/runtime';
import type {AuditEvent} from '@/types/admin/audit-event';
import type {PracticeUser} from '@/types/admin/practice-user';

function unavailable(message: string): Promise<never> {
	return Promise.reject(new ApiError(message, 404));
}

export const adminRealAPI = {
	listUsers: async (): Promise<PracticeUser[]> =>
		unavailable('Practice users are not available from the administration API'),
	listAuditEvents: async (): Promise<AuditEvent[]> =>
		unavailable('Audit events are not available from the administration API'),
};

export const adminAPI = isMockMode() ? adminMockAPI : adminRealAPI;
