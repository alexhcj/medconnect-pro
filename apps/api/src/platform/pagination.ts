import {z} from 'zod';

export const DEFAULT_LIST_PAGE_SIZE = 25;
export const MAX_LIST_PAGE_SIZE = 100;
export const MAX_LIST_PAGE = 1000;

const emptyToUndefined = (value: unknown) => (value === undefined || value === '' ? undefined : value);

/** Shared `page` / `pageSize` query fields for page-based list endpoints. */
export const pageQueryShape = {
	page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(MAX_LIST_PAGE).optional()),
	pageSize: z.preprocess(
		emptyToUndefined,
		z.coerce.number().int().min(1).max(MAX_LIST_PAGE_SIZE).optional(),
	),
};

export type PageRequest = {page: number; pageSize: number};

export function resolvePageRequest(query: {page?: number; pageSize?: number}): PageRequest {
	return {page: query.page ?? 1, pageSize: query.pageSize ?? DEFAULT_LIST_PAGE_SIZE};
}

export type PageMeta = {total: number; hasMore: boolean; nextPage?: number};

export function toPageMeta(total: number, {page, pageSize}: PageRequest): PageMeta {
	const hasMore = page * pageSize < total;
	return {total, hasMore, nextPage: hasMore ? page + 1 : undefined};
}
