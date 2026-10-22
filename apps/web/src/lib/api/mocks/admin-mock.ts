import type {ApiAuditAction} from '@/lib/admin/event-filter-options';
import {dayEndIso, dayStartIso} from '@/lib/admin/list-params';
import {ApiError} from '@/lib/api/http';
import {fixtureAdminUsers, fixtureAuditEvents, fixtureSecurityEvents} from '@/lib/api/mocks/fixtures';
import {readMockSession} from '@/lib/api/mocks/mock-session-store';
import {mockDelay, mockLog, shouldSimulateError} from '@/lib/api/mocks/runtime';
import {
	ADMIN_PAGE_SIZE,
	type EventListParams,
	type PagedResult,
	type UserListParams,
} from '@/types/admin/admin-list';
import type {AuditEvent} from '@/types/admin/audit-event';
import type {PracticeUser} from '@/types/admin/practice-user';
import {isRole, type Role} from '@/types/auth/roles';

const FORBIDDEN_MESSAGE = 'You do not have permission to perform this action';

const GENERATED_AUDIT = 60;
const GENERATED_SECURITY = 40;
const GENERATED_USERS = 40;

const AUDIT_ACTIONS = [
	['patient.accessed', 'patient'],
	['auth.login.succeeded', 'session'],
	['appointment.created', 'appointment'],
	['invoice.created', 'invoice'],
	['access.denied', 'patient'],
	['membership.role_changed', 'user'],
] as const satisfies readonly (readonly [ApiAuditAction, string])[];
const SECURITY_ACTIONS = [
	'auth.login.succeeded',
	'auth.login.failed',
	'auth.mfa.succeeded',
	'auth.mfa.failed',
	'auth.logout',
	'auth.session.revoked',
] as const satisfies readonly ApiAuditAction[];
const GENERATED_ROLES: Role[] = ['PROVIDER', 'NURSE', 'RECEPTIONIST', 'PATIENT'];
const ACTORS = ['user_mock_practice_admin', 'user_mock_provider', 'user_mock_nurse'];

function generatedEvents(
	prefix: string,
	count: number,
	start: string,
	pick: (index: number) => {action: string; resourceType: string},
): AuditEvent[] {
	const base = Date.parse(start);
	return Array.from({length: count}, (_, index) => {
		const n = String(index + 1).padStart(3, '0');
		const {action, resourceType} = pick(index);
		return {
			id: `${prefix}-gen-${n}`,
			practiceId: 'demo-practice-001',
			actorUserId: ACTORS[index % ACTORS.length],
			action,
			resourceType,
			resourceId: null,
			correlationId: `${prefix}-gen-correlation-${n}`,
			createdAt: new Date(base - index * 45 * 60 * 1000).toISOString(),
		};
	});
}

/** Older synthetic rows appended after the shared fixtures so paging has volume in mock mode. */
function seedAudit(): AuditEvent[] {
	return [
		...structuredClone(fixtureAuditEvents),
		...generatedEvents('demo-audit', GENERATED_AUDIT, '2026-09-25T12:00:00.000Z', (index) => {
			const [action, resourceType] = AUDIT_ACTIONS[index % AUDIT_ACTIONS.length];
			return {action, resourceType};
		}),
	];
}

function seedSecurity(): AuditEvent[] {
	return [
		...structuredClone(fixtureSecurityEvents),
		...generatedEvents('demo-security', GENERATED_SECURITY, '2026-10-05T16:00:00.000Z', (index) => ({
			action: SECURITY_ACTIONS[index % SECURITY_ACTIONS.length],
			resourceType: 'session',
		})),
	];
}

function seedUsers(): PracticeUser[] {
	return [
		...structuredClone(fixtureAdminUsers),
		...Array.from({length: GENERATED_USERS}, (_, index): PracticeUser => {
			const n = String(index + 1).padStart(3, '0');
			return {
				id: `user_mock_gen_${n}`,
				email: `demo.user.${n}@example.test`,
				role: GENERATED_ROLES[index % GENERATED_ROLES.length],
				practiceId: 'demo-practice-001',
				synthetic: true,
			};
		}),
	];
}

function pageOf<T extends object>(rows: T[], page: number): PagedResult<T> {
	const start = (page - 1) * ADMIN_PAGE_SIZE;
	const items = rows.slice(start, start + ADMIN_PAGE_SIZE).map((row) => ({...row}));
	const hasMore = page * ADMIN_PAGE_SIZE < rows.length;
	return {items, total: rows.length, hasMore, nextPage: hasMore ? page + 1 : undefined};
}

function filterEvents(rows: AuditEvent[], params: EventListParams): AuditEvent[] {
	if (params.from && params.to && params.to < params.from) {
		throw new ApiError('Request validation failed', 400, {code: 'VALIDATION_ERROR'});
	}
	const from = params.from ? dayStartIso(params.from) : undefined;
	const to = params.to ? dayEndIso(params.to) : undefined;
	return rows.filter(
		(event) =>
			(!params.action || event.action === params.action) &&
			(!params.resourceType || event.resourceType === params.resourceType) &&
			(!from || event.createdAt >= from) &&
			(!to || event.createdAt <= to),
	);
}

function filterUsers(rows: PracticeUser[], params: UserListParams): PracticeUser[] {
	const q = params.q?.trim().toLowerCase();
	return rows.filter(
		(user) => (!q || user.email.toLowerCase().includes(q)) && (!params.role || user.role === params.role),
	);
}

let users: PracticeUser[] = seedUsers();
let events: AuditEvent[] = seedAudit();
let securityEvents: AuditEvent[] = seedSecurity();

export function resetAdminMock(): void {
	users = seedUsers();
	events = seedAudit();
	securityEvents = seedSecurity();
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
	listUsers: async (params: UserListParams = {page: 1}): Promise<PagedResult<PracticeUser>> =>
		withMock(() => pageOf(filterUsers(users, params), params.page), 'Mock: Failed to load practice users'),

	listAuditEvents: async (params: EventListParams = {page: 1}): Promise<PagedResult<AuditEvent>> =>
		withMock(
			() => pageOf(filterEvents(events, params), params.page),
			'Mock: Failed to load audit events',
		),

	listSecurityEvents: async (
		params: EventListParams = {page: 1},
	): Promise<PagedResult<AuditEvent>> =>
		withMock(
			() => pageOf(filterEvents(securityEvents, params), params.page),
			'Mock: Failed to load security events',
		),

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
