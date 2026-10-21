import {act, renderHook} from '@testing-library/react';
import {resetPendingListUrlPush, useListUrlState} from '@/lib/admin/use-list-url-state';

const {push, searchParams} = vi.hoisted(() => ({
	push: vi.fn(),
	searchParams: {current: new URLSearchParams()},
}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({push}),
	usePathname: () => '/dashboard/admin',
	useSearchParams: () => searchParams.current,
}));

const NAMES = ['action', 'from'] as const;

describe('useListUrlState', () => {
	beforeEach(() => {
		resetPendingListUrlPush();
		push.mockClear();
		searchParams.current = new URLSearchParams();
	});

	it('defaults to page 1 and empty filters', () => {
		const {result} = renderHook(() => useListUrlState('audit', NAMES));
		expect(result.current.page).toBe(1);
		expect(result.current.filters).toEqual({action: undefined, from: undefined});
	});

	it('reads its own prefixed params and ignores other lists', () => {
		searchParams.current = new URLSearchParams(
			'auditPage=3&auditAction=role_changed&securityPage=9&usersQ=nurse',
		);
		const {result} = renderHook(() => useListUrlState('audit', NAMES));
		expect(result.current.page).toBe(3);
		expect(result.current.filters.action).toBe('role_changed');
	});

	it('falls back to page 1 for an invalid page', () => {
		searchParams.current = new URLSearchParams('auditPage=-4');
		const {result} = renderHook(() => useListUrlState('audit', NAMES));
		expect(result.current.page).toBe(1);
	});

	it('pushes the page and keeps filters and other lists', () => {
		searchParams.current = new URLSearchParams('auditAction=x&usersPage=2');
		const {result} = renderHook(() => useListUrlState('audit', NAMES));
		act(() => result.current.setPage(4));
		expect(push).toHaveBeenCalledWith(
			'/dashboard/admin?auditAction=x&usersPage=2&auditPage=4',
			{scroll: false},
		);
	});

	it('drops the page key when going back to page 1', () => {
		searchParams.current = new URLSearchParams('auditPage=2');
		const {result} = renderHook(() => useListUrlState('audit', NAMES));
		act(() => result.current.setPage(1));
		expect(push).toHaveBeenCalledWith('/dashboard/admin', {scroll: false});
	});

	it('keeps the patients list under its own prefix', () => {
		searchParams.current = new URLSearchParams('patientsPage=2&patientsQ=avery&auditPage=7');
		const {result} = renderHook(() => useListUrlState('patients', ['q', 'status', 'sort']));
		expect(result.current.page).toBe(2);
		expect(result.current.filters).toEqual({q: 'avery', status: undefined, sort: undefined});
	});

	it('resets to page 1 when filters change and removes blank filters', () => {
		searchParams.current = new URLSearchParams('auditPage=5&auditFrom=2026-10-01&usersPage=2');
		const {result} = renderHook(() => useListUrlState('audit', NAMES));
		act(() => result.current.setFilters({action: ' role_changed ', from: ''}));
		expect(push).toHaveBeenCalledWith(
			'/dashboard/admin?usersPage=2&auditAction=role_changed',
			{scroll: false},
		);
	});

	it('keeps an earlier push from another list when two changes land before the URL updates', () => {
		const invoices = renderHook(() => useListUrlState('invoices', []));
		const claims = renderHook(() => useListUrlState('claims', []));
		act(() => invoices.result.current.setPage(2));
		act(() => claims.result.current.setPage(3));

		expect(push).toHaveBeenLastCalledWith('/dashboard/admin?invoicesPage=2&claimsPage=3', {scroll: false});
	});

	it('builds on the newest push when a later snapshot only shows the first one', () => {
		const first = renderHook(() => useListUrlState('invoices', []));
		act(() => first.result.current.setPage(2));
		const stale = renderHook(() => useListUrlState('claims', []));
		act(() => stale.result.current.setPage(3));
		// The router has shown the first push only, so this snapshot sits in the middle of the chain.
		searchParams.current = new URLSearchParams('invoicesPage=2');
		const middle = renderHook(() => useListUrlState('invoices', ['status']));
		act(() => middle.result.current.setFilters({status: 'paid'}));

		expect(push).toHaveBeenLastCalledWith('/dashboard/admin?claimsPage=3&invoicesStatus=paid', {scroll: false});
	});
});
