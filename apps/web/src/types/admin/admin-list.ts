import type {Role} from '@/types/auth/roles';

export const ADMIN_PAGE_SIZE = 25;

export interface PagedResult<T> {
	items: T[];
	total: number;
	hasMore: boolean;
	nextPage?: number;
}

/** Filters for audit and security events. `from` and `to` are `yyyy-mm-dd` (UTC days). */
export interface EventListParams {
	page: number;
	action?: string;
	resourceType?: string;
	from?: string;
	to?: string;
}

export interface UserListParams {
	page: number;
	q?: string;
	role?: Role;
}
