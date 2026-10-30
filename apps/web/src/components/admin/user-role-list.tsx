'use client';

import {FormEvent, useEffect, useId, useState} from 'react';
import {
	ListNotice,
	ListSkeleton,
	useFocusHeadingOnPageChange,
} from '@/components/admin/admin-list-states';
import {SelectField as FilterSelectField} from '@/components/admin/list-filter-fields';
import {SelectField} from '@/components/ui/select-field';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Pagination} from '@/components/ui/pagination';
import {roleSelectOptions} from '@/lib/admin/assignable-roles';
import {adminLoadErrorMessage} from '@/lib/admin/load-error';
import {pageRange} from '@/lib/admin/list-params';
import {useListUrlState} from '@/lib/admin/use-list-url-state';
import {useAdminUsers, useAssignUserRole} from '@/lib/hooks/use-admin';
import type {PracticeUser} from '@/types/admin/practice-user';
import {isRole, parseRole, ROLES, type Role} from '@/types/auth/roles';

const FILTER_NAMES = ['q', 'role'] as const;

export function UserRoleList() {
	const {page, filters, setPage, setFilters} = useListUrlState('users', FILTER_NAMES);
	const q = filters.q;
	const role = parseRole(filters.role);
	const users = useAdminUsers({page, q, role});
	const assignRole = useAssignUserRole();
	const headingRef = useFocusHeadingOnPageChange(page);
	const searchId = useId();
	const [searchDraft, setSearchDraft] = useState(q ?? '');
	useEffect(() => setSearchDraft(q ?? ''), [q]);

	const assignError =
		assignRole.error != null
			? adminLoadErrorMessage(assignRole.error, 'Unable to change this membership role.')
			: null;
	const hasFilters = Boolean(q || role);
	const data = users.data;
	const showFilters = hasFilters || !data || data.total > 0;
	const isBusy = users.isPlaceholderData === true;

	function submitSearch(event: FormEvent) {
		event.preventDefault();
		setFilters({q: searchDraft, role});
	}

	return (
		<Card>
			<CardHeader>
				<h2
					ref={headingRef}
					tabIndex={-1}
					className="text-lg font-semibold text-foreground focus:outline-none"
				>
					Users
				</h2>
				<p className="text-sm text-foreground-secondary">
					Synthetic practice directory. Change a membership role for this practice.
				</p>
			</CardHeader>
			<CardContent className="space-y-3">
				{showFilters && (
					<div
						role="group"
						aria-label="Users filters"
						className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start"
					>
						<form
							role="search"
							aria-label="Search users"
							onSubmit={submitSearch}
							className="flex flex-col gap-3 md:flex-row md:items-start"
						>
							<div className="flex flex-col gap-1 md:w-80">
								<label htmlFor={searchId} className="text-sm font-medium text-foreground-label">
									Search users
								</label>
								<Input
									id={searchId}
									type="search"
									value={searchDraft}
									placeholder="Search by email"
									disabled={users.isPending}
									onChange={(event) => setSearchDraft(event.target.value)}
								/>
							</div>
							<Button type="submit" size="default" className="md:mt-6" disabled={users.isPending}>
								Search
							</Button>
						</form>
						<FilterSelectField
							label="Role"
							value={role ?? ''}
							options={ROLES}
							allLabel="All roles"
							disabled={users.isPending}
							className="md:w-52"
							onChange={(value) => setFilters({q, role: value})}
						/>
						{hasFilters && (
							<Button
								type="button"
								variant="ghost"
								size="default"
								className="md:mt-6"
								onClick={() => setFilters({})}
							>
								Clear filters
							</Button>
						)}
					</div>
				)}

				{users.isPending && <ListSkeleton label="Loading practice users" />}

				{users.isError && (
					<ListNotice
						tone="error"
						message={adminLoadErrorMessage(users.error, 'Unable to load practice users.')}
						action={{label: 'Retry', onClick: () => users.refetch()}}
					/>
				)}

				{!users.isPending && !users.isError && data && data.total === 0 && (
					<ListNotice
						message={hasFilters ? 'No users match this search.' : 'No practice users to display.'}
					/>
				)}

				{!users.isPending && !users.isError && data && data.total > 0 && data.items.length === 0 && (
					<ListNotice
						message={`Page ${page} is past the end of the results (${data.total} users).`}
						action={{label: 'Back to first page', onClick: () => setPage(1)}}
					/>
				)}

				{!users.isPending && !users.isError && data && data.items.length > 0 && (
					<>
						<p aria-live="polite" className="text-sm text-foreground-secondary">
							Showing {pageRange(page, data.items.length).first}–
							{pageRange(page, data.items.length).last} of {data.total} users
						</p>
						<div
							className={`md:overflow-hidden md:rounded-lg md:border md:border-border ${isBusy ? 'opacity-50' : ''}`}
							aria-busy={isBusy || undefined}
						>
							<table aria-label="Practice users" role="table" className="block w-full md:table">
								<thead role="rowgroup" className="sr-only md:not-sr-only md:table-header-group">
									<tr role="row" className="bg-muted">
										<th
											role="columnheader"
											scope="col"
											className="px-4 py-2 text-left text-sm font-medium text-foreground-label"
										>
											User
										</th>
										<th
											role="columnheader"
											scope="col"
											className="px-4 py-2 text-left text-sm font-medium text-foreground-label md:w-72"
										>
											Role
										</th>
									</tr>
								</thead>
								<tbody role="rowgroup" className="block space-y-2 md:table-row-group md:space-y-0">
									{data.items.map((user) => (
										<UserRoleRow
											key={user.id}
											user={user}
											isPending={assignRole.isPending && assignRole.variables?.userId === user.id}
											isSuccess={assignRole.isSuccess && assignRole.variables?.userId === user.id}
											error={assignRole.variables?.userId === user.id ? assignError : null}
											onRoleChange={(next) => {
												if (next === user.role) {
													return;
												}
												assignRole.mutate({userId: user.id, role: next});
											}}
										/>
									))}
								</tbody>
							</table>
						</div>
						<Pagination
							label="Practice users"
							page={page}
							total={data.total}
							disabled={isBusy}
							onPageChange={setPage}
						/>
					</>
				)}
			</CardContent>
		</Card>
	);
}

function UserRoleRow({
	user,
	isPending,
	isSuccess,
	error,
	onRoleChange,
}: {
	user: PracticeUser;
	isPending: boolean;
	isSuccess: boolean;
	error: string | null;
	onRoleChange: (role: Role) => void;
}) {
	const selectId = `role-${user.id}`;
	const options = roleSelectOptions(user.role);

	function handleChange(next: string) {
		if (!isRole(next) || next === user.role) {
			return;
		}
		onRoleChange(next);
	}

	return (
		<tr
			role="row"
			aria-busy={isPending || undefined}
			className="block rounded-lg border border-border p-4 md:table-row md:rounded-none md:border-0 md:p-0"
		>
			<td
				role="cell"
				className="block md:table-cell md:border-t md:border-border md:px-4 md:py-3"
			>
				<p className="break-all font-medium text-foreground">{user.email}</p>
				<p className="mt-1 break-all text-sm text-foreground-secondary">{user.id}</p>
			</td>
			<td
				role="cell"
				className="mt-3 block md:mt-0 md:table-cell md:border-t md:border-border md:px-4 md:py-3 md:align-top"
			>
				<div className="flex flex-col gap-1">
					<SelectField
						id={selectId}
						label={`Role for ${user.email}`}
						labelClassName="break-all text-xs font-normal text-foreground-muted md:sr-only"
						size="compact"
						value={user.role}
						options={options.map((option) => ({value: option, label: option}))}
						disabled={isPending}
						aria-busy={isPending || undefined}
						error={error}
						status={isSuccess ? 'Role updated' : null}
						onChange={handleChange}
					/>
					{isPending && <span className="sr-only">Saving role</span>}
				</div>
			</td>
		</tr>
	);
}
