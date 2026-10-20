import {act, renderHook} from '@testing-library/react';
import {useListUrlState} from '@/lib/admin/use-list-url-state';

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

	it('resets to page 1 when filters change and removes blank filters', () => {
		searchParams.current = new URLSearchParams('auditPage=5&auditFrom=2026-10-01&usersPage=2');
		const {result} = renderHook(() => useListUrlState('audit', NAMES));
		act(() => result.current.setFilters({action: ' role_changed ', from: ''}));
		expect(push).toHaveBeenCalledWith(
			'/dashboard/admin?usersPage=2&auditAction=role_changed',
			{scroll: false},
		);
	});
});
