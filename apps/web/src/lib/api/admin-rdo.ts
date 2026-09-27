import type {AuditEvent} from '@/types/admin/audit-event';
import type {PracticeUser} from '@/types/admin/practice-user';
import type {Role} from '@/types/auth/roles';

/** Practice user returned by Nest `PracticeUserRdo`. `practiceId` is informational only. */
export interface PracticeUserRdo {
	id: string;
	email: string;
	role: Role;
	practiceId: string;
	synthetic: boolean;
}

export interface PracticeUserListRdo {
	users: PracticeUserRdo[];
}

/** Audit event returned by Nest `AuditEventRdo`. `practiceId` is informational only. */
export interface AuditEventRdo {
	id: string;
	practiceId: string;
	actorUserId: string;
	action: string;
	resourceType: string;
	resourceId: string | null;
	correlationId: string;
	createdAt: string;
}

export interface AuditEventSearchResultRdo {
	events: AuditEventRdo[];
	nextPage?: number;
	hasMore: boolean;
}

export function practiceUserFromRdo(rdo: PracticeUserRdo): PracticeUser {
	return {
		id: rdo.id,
		email: rdo.email,
		role: rdo.role,
		practiceId: rdo.practiceId,
		synthetic: rdo.synthetic,
	};
}

export function auditEventFromRdo(rdo: AuditEventRdo): AuditEvent {
	return {
		id: rdo.id,
		practiceId: rdo.practiceId,
		actorUserId: rdo.actorUserId,
		action: rdo.action,
		resourceType: rdo.resourceType,
		resourceId: rdo.resourceId,
		correlationId: rdo.correlationId,
		createdAt: rdo.createdAt,
	};
}
