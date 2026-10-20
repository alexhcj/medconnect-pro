'use client';

import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {useCallback} from 'react';
import {parsePage} from '@/lib/admin/list-params';

export type ListUrlPrefix = 'audit' | 'security' | 'users' | 'patients';

function key(prefix: ListUrlPrefix, name: string): string {
	return `${prefix}${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

/**
 * Page and filters for one administration list, kept in URL query params so refresh and
 * back/forward keep position. Each list owns its own prefix because three lists share one URL.
 */
export function useListUrlState(prefix: ListUrlPrefix, filterNames: readonly string[]) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const page = parsePage(searchParams.get(key(prefix, 'page')));
	const filters: Record<string, string | undefined> = {};
	for (const name of filterNames) {
		filters[name] = searchParams.get(key(prefix, name)) || undefined;
	}

	const push = useCallback(
		(mutate: (next: URLSearchParams) => void) => {
			const next = new URLSearchParams(searchParams.toString());
			mutate(next);
			const query = next.toString();
			router.push(query ? `${pathname}?${query}` : pathname, {scroll: false});
		},
		[pathname, router, searchParams],
	);

	const setPage = useCallback(
		(target: number) => {
			push((next) => {
				if (target <= 1) {
					next.delete(key(prefix, 'page'));
				} else {
					next.set(key(prefix, 'page'), String(target));
				}
			});
		},
		[prefix, push],
	);

	/** Replaces this list's filters and returns to page 1. Blank values are removed. */
	const setFilters = useCallback(
		(values: Record<string, string | undefined>) => {
			push((next) => {
				next.delete(key(prefix, 'page'));
				for (const name of filterNames) {
					const value = values[name]?.trim();
					if (value) {
						next.set(key(prefix, name), value);
					} else {
						next.delete(key(prefix, name));
					}
				}
			});
		},
		[filterNames, prefix, push],
	);

	return {page, filters, setPage, setFilters};
}
