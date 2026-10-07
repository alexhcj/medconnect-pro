'use client';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {formatAuditDate} from '@/lib/admin/format';
import {adminLoadErrorMessage} from '@/lib/admin/load-error';
import {useSecurityEvents} from '@/lib/hooks/use-admin';

export function SecurityEventViewer() {
	const events = useSecurityEvents();

	return (
		<Card>
			<CardHeader>
				<h2 className="text-lg font-semibold text-gray-900">Security events</h2>
				<p className="text-sm text-gray-600">
					Tenant-scoped authentication and session events. Synthetic ids only. Not a SIEM or HIPAA
					audit export.
				</p>
			</CardHeader>
			<CardContent>
				{events.isPending && (
					<div className="space-y-3" aria-busy="true">
						<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
						<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
						<span className="sr-only">Loading security events</span>
					</div>
				)}

				{events.isError && (
					<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
						<p className="text-sm text-gray-700">
							{adminLoadErrorMessage(events.error, 'Unable to load security events.')}
						</p>
						<Button type="button" className="mt-3" variant="outline" onClick={() => events.refetch()}>
							Retry
						</Button>
					</div>
				)}

				{!events.isPending && !events.isError && (events.data?.length ?? 0) === 0 && (
					<p className="text-sm text-gray-600">No security events to display.</p>
				)}

				{!events.isPending && !events.isError && (events.data?.length ?? 0) > 0 && (
					<ul className="space-y-3" aria-label="Security events">
						{events.data?.map((event) => (
							<li
								key={event.id}
								className="flex flex-col gap-1 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
							>
								<div>
									<p className="font-medium text-gray-900">{event.action}</p>
									<p className="mt-1 text-sm text-gray-700">
										{event.resourceType}
										{event.resourceId ? ` ${event.resourceId}` : ''}
									</p>
									<p className="mt-1 text-sm text-gray-600">Actor {event.actorUserId}</p>
								</div>
								<p className="text-sm text-gray-600">{formatAuditDate(event.createdAt)}</p>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
