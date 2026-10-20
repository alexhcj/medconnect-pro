import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {act, renderHook, waitFor} from '@testing-library/react';
import type {ReactNode} from 'react';
import {adminUsersQueryKey, useAdminUsers, useAssignUserRole, useAuditEvents} from '@/lib/hooks/use-admin';
import type {PagedResult} from '@/types/admin/admin-list';
import type {PracticeUser} from '@/types/admin/practice-user';

const {listUsers, listAuditEvents, assignRole} = vi.hoisted(() => ({
	listUsers: vi.fn(),
	listAuditEvents: vi.fn(),
	assignRole: vi.fn(),
}));

vi.mock('@/lib/api/admin-api', () => ({
	adminAPI: {listUsers, listAuditEvents, listSecurityEvents: vi.fn(), assignRole},
}));

const provider: PracticeUser = {
	id: 'user_a',
	email: 'a@example.test',
	role: 'PROVIDER',
	practiceId: 'demo-practice-001',
	synthetic: true,
};

function wrapper() {
	const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
	return {
		client,
		Wrapper: ({children}: {children: ReactNode}) => (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		),
	};
}

describe('admin list hooks', () => {
	beforeEach(() => {
		listUsers.mockReset();
		listAuditEvents.mockReset();
		assignRole.mockReset();
	});

	it('fetches exactly one page per page and filter combination', async () => {
		listAuditEvents.mockResolvedValue({items: [], total: 0, hasMore: false});
		const {Wrapper} = wrapper();
		const {result, rerender} = renderHook(
			({params}) => useAuditEvents(params),
			{wrapper: Wrapper, initialProps: {params: {page: 1}}},
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(listAuditEvents).toHaveBeenCalledTimes(1);
		expect(listAuditEvents).toHaveBeenLastCalledWith({page: 1});

		rerender({params: {page: 2}});
		await waitFor(() => expect(listAuditEvents).toHaveBeenCalledTimes(2));
		expect(listAuditEvents).toHaveBeenLastCalledWith({page: 2});

		rerender({params: {page: 1}});
		expect(listAuditEvents).toHaveBeenCalledTimes(2);
	});

	it('keeps the previous page while the next one loads', async () => {
		const first: PagedResult<PracticeUser> = {items: [provider], total: 40, hasMore: true, nextPage: 2};
		listUsers.mockResolvedValueOnce(first).mockImplementationOnce(() => new Promise(() => {}));
		const {Wrapper} = wrapper();
		const {result, rerender} = renderHook(({page}) => useAdminUsers({page}), {
			wrapper: Wrapper,
			initialProps: {page: 1},
		});
		await waitFor(() => expect(result.current.data).toEqual(first));

		rerender({page: 2});
		await waitFor(() => expect(result.current.isPlaceholderData).toBe(true));
		expect(result.current.data).toEqual(first);
	});

	it('patches the changed user in every cached users page after a role change', async () => {
		assignRole.mockResolvedValue({...provider, role: 'NURSE'});
		const {client, Wrapper} = wrapper();
		client.setQueryData([...adminUsersQueryKey, {page: 1}], {items: [provider], total: 2, hasMore: false});
		client.setQueryData([...adminUsersQueryKey, {page: 1, role: 'PROVIDER'}], {
			items: [provider],
			total: 1,
			hasMore: false,
		});

		const {result} = renderHook(() => useAssignUserRole(), {wrapper: Wrapper});
		await act(async () => {
			await result.current.mutateAsync({userId: 'user_a', role: 'NURSE'});
		});

		for (const params of [{page: 1}, {page: 1, role: 'PROVIDER'}]) {
			const cached = client.getQueryData<PagedResult<PracticeUser>>([...adminUsersQueryKey, params]);
			expect(cached?.items[0]?.role).toBe('NURSE');
			expect(cached?.total).toBeGreaterThan(0);
		}
	});
});
