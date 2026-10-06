'use client';

import {ChangeEvent} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {roleSelectOptions} from '@/lib/admin/assignable-roles';
import {adminLoadErrorMessage} from '@/lib/admin/load-error';
import {useAdminUsers, useAssignUserRole} from '@/lib/hooks/use-admin';
import type {PracticeUser} from '@/types/admin/practice-user';
import {isRole, type Role} from '@/types/auth/roles';

export function UserRoleList() {
	const users = useAdminUsers();
	const assignRole = useAssignUserRole();
	const assignError =
		assignRole.error != null
			? adminLoadErrorMessage(assignRole.error, 'Unable to change this membership role.')
			: null;

	return (
		<Card>
			<CardHeader>
				<h2 className="text-lg font-semibold text-gray-900">Users</h2>
				<p className="text-sm text-gray-600">
					Synthetic practice directory. Change a membership role for this practice.
				</p>
			</CardHeader>
			<CardContent>
				{users.isPending && (
					<div className="space-y-3" aria-busy="true">
						<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
						<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
						<span className="sr-only">Loading practice users</span>
					</div>
				)}

				{users.isError && (
					<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
						<p className="text-sm text-gray-700">
							{adminLoadErrorMessage(users.error, 'Unable to load practice users.')}
						</p>
						<Button type="button" className="mt-3" variant="outline" onClick={() => users.refetch()}>
							Retry
						</Button>
					</div>
				)}

				{!users.isPending && !users.isError && (users.data?.length ?? 0) === 0 && (
					<p className="text-sm text-gray-600">No practice users to display.</p>
				)}

				{!users.isPending && !users.isError && (users.data?.length ?? 0) > 0 && (
					<ul className="space-y-3" aria-label="Practice users">
						{users.data?.map((user) => (
							<UserRoleRow
								key={user.id}
								user={user}
								isPending={assignRole.isPending && assignRole.variables?.userId === user.id}
								isSuccess={assignRole.isSuccess && assignRole.variables?.userId === user.id}
								error={assignRole.variables?.userId === user.id ? assignError : null}
								onRoleChange={(role) => {
									if (role === user.role) {
										return;
									}
									assignRole.mutate({userId: user.id, role});
								}}
							/>
						))}
					</ul>
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
	const errorId = `${selectId}-error`;
	const statusId = `${selectId}-status`;
	const options = roleSelectOptions(user.role);
	const describedBy = error ? errorId : isSuccess ? statusId : undefined;

	function handleChange(event: ChangeEvent<HTMLSelectElement>) {
		const next = event.target.value;
		if (!isRole(next) || next === user.role) {
			return;
		}
		onRoleChange(next);
	}

	return (
		<li
			className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
			aria-busy={isPending || undefined}
		>
			<div>
				<p className="font-medium text-gray-900">{user.email}</p>
				<p className="mt-1 text-sm text-gray-600">{user.id}</p>
			</div>
			<div className="flex flex-col gap-1 md:items-end">
				<label htmlFor={selectId} className="text-xs text-gray-500">
					Role for {user.email}
				</label>
				<select
					id={selectId}
					value={user.role}
					disabled={isPending}
					aria-invalid={error ? true : undefined}
					aria-describedby={describedBy}
					aria-busy={isPending || undefined}
					onChange={handleChange}
					className="h-10 min-w-[180px] rounded-md border border-input bg-surface px-3 text-sm font-medium text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
				>
					{options.map((role) => (
						<option key={role} value={role}>
							{role}
						</option>
					))}
				</select>
				{isPending && <span className="sr-only">Saving role</span>}
				{error && (
					<p id={errorId} className="text-sm text-danger" role="alert">
						{error}
					</p>
				)}
				{isSuccess && !error && (
					<p id={statusId} className="text-sm text-gray-600" role="status">
						Role updated
					</p>
				)}
			</div>
		</li>
	);
}
