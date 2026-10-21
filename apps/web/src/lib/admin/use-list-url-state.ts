'use client';

import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {useCallback} from 'react';
import {parsePage} from '@/lib/admin/list-params';

export type ListUrlPrefix = 'audit' | 'security' | 'users' | 'patients' | 'invoices' | 'claims';

/**
 * Queries this module pushed since the router last reported back, oldest first (starting with the URL
 * the first push was built from). Lists on one page (invoices and claims) each hold their own
 * `searchParams` snapshot, so two quick changes would otherwise both start from an old URL and the
 * second would drop the first. A snapshot that matches any query in the chain builds on the newest.
 */
let pending: {pathname: string; chain: string[]; at: number} | null = null;
const PENDING_TTL_MS = 2000;

/** For tests: forget the last push so one test's URL change cannot leak into the next. */
export function resetPendingListUrlPush(): void {
	pending = null;
}

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
			const from = searchParams.toString();
			const chain =
				pending !== null &&
				pending.pathname === pathname &&
				pending.chain.includes(from) &&
				Date.now() - pending.at < PENDING_TTL_MS
					? pending.chain
					: [from];
			const next = new URLSearchParams(chain[chain.length - 1]);
			mutate(next);
			const query = next.toString();
			pending = {pathname, chain: [...chain, query], at: Date.now()};
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
