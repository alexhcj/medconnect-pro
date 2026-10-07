'use client';

import {ADMIN_DEMO_NOTICE} from '@/components/admin/admin-demo-notice';
import {AuditEventViewer} from '@/components/admin/audit-event-viewer';
import {SecurityEventViewer} from '@/components/admin/security-event-viewer';
import {UserRoleList} from '@/components/admin/user-role-list';
import {canAccessAdministration} from '@/lib/auth/admin-access';
import {useSessionStatus} from '@/lib/hooks/use-session';

export default function AdministrationPage() {
	const {session, isLoading: isSessionLoading} = useSessionStatus();
	const canAccess = !isSessionLoading && canAccessAdministration(session?.userRole);

	return (
		<div>
			<h1 className="mb-2 text-2xl font-bold text-gray-900">Administration</h1>
			<p className="mb-6 text-sm text-gray-600">{ADMIN_DEMO_NOTICE}</p>

			{isSessionLoading && (
				<div className="space-y-3" aria-busy="true">
					<div className="h-24 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading administration</span>
				</div>
			)}

			{!isSessionLoading && !canAccess && (
				<div className="rounded-lg border border-gray-200 bg-white p-4" role="status">
					<p className="text-sm text-gray-700">You do not have access to administration.</p>
				</div>
			)}

			{canAccess && (
				<div className="space-y-6">
					<UserRoleList />
					<AuditEventViewer />
					<SecurityEventViewer />
				</div>
			)}
		</div>
	);
}
