'use client';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {adminLoadErrorMessage} from '@/lib/admin/load-error';
import {useAdminUsers} from '@/lib/hooks/use-admin';

export function UserRoleList() {
	const users = useAdminUsers();

	return (
		<Card>
			<CardHeader>
				<h2 className="text-lg font-semibold text-gray-900">Users</h2>
				<p className="text-sm text-gray-600">Synthetic practice directory. Roles are not assigned from this screen.</p>
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
							<li
								key={user.id}
								className="flex flex-col gap-1 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
							>
								<div>
									<p className="font-medium text-gray-900">{user.email}</p>
									<p className="mt-1 text-sm text-gray-600">{user.id}</p>
								</div>
								<p className="text-sm font-medium text-gray-900">{user.role}</p>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
