import {
	ADMIN_PAGE_SIZE,
	type EventListParams,
	type UserListParams,
} from '@/types/admin/admin-list';

const MAX_PAGE = 1000;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function parsePage(value: string | null | undefined): number {
	const page = Number(value);
	return Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1;
}

export function parseDay(value: string | null | undefined): string | undefined {
	if (!value || !DAY.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))) {
		return undefined;
	}
	return value;
}

export function dayStartIso(day: string): string {
	return `${day}T00:00:00.000Z`;
}

export function dayEndIso(day: string): string {
	return `${day}T23:59:59.999Z`;
}

/** The API requires `to` strictly after `from`, so a same-day range is valid but a reversed one is not. */
export function dateRangeError(from?: string, to?: string): string | null {
	if (from && to && to < from) {
		return 'The end date must be on or after the start date.';
	}
	return null;
}

function set(query: URLSearchParams, key: string, value: string | undefined): void {
	const trimmed = value?.trim();
	if (trimmed) {
		query.set(key, trimmed);
	}
}

/** Query string for audit and security lists. Tenant scope always comes from the session, never from here. */
export function eventListQuery(params: EventListParams): string {
	const query = new URLSearchParams({page: String(params.page), pageSize: String(ADMIN_PAGE_SIZE)});
	set(query, 'action', params.action);
	set(query, 'resourceType', params.resourceType);
	if (params.from) {
		query.set('from', dayStartIso(params.from));
	}
	if (params.to) {
		query.set('to', dayEndIso(params.to));
	}
	return query.toString();
}

export function userListQuery(params: UserListParams): string {
	const query = new URLSearchParams({page: String(params.page), pageSize: String(ADMIN_PAGE_SIZE)});
	set(query, 'q', params.q);
	set(query, 'role', params.role);
	return query.toString();
}

export function pageRange(
	page: number,
	count: number,
	pageSize = ADMIN_PAGE_SIZE,
): {first: number; last: number} {
	if (count === 0) {
		return {first: 0, last: 0};
	}
	const first = (page - 1) * pageSize + 1;
	return {first, last: first + count - 1};
}

export function pageCount(total: number, pageSize = ADMIN_PAGE_SIZE): number {
	return Math.max(1, Math.ceil(total / pageSize));
}
