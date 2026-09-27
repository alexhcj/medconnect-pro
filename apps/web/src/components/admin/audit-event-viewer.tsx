'use client';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {formatAuditDate} from '@/lib/admin/format';
import {adminLoadErrorMessage} from '@/lib/admin/load-error';
import {useAuditEvents} from '@/lib/hooks/use-admin';

export function AuditEventViewer() {
	const events = useAuditEvents();

	return (
		<Card>
			<CardHeader>
				<h2 className="text-lg font-semibold text-gray-900">Audit events</h2>
				<p className="text-sm text-gray-600">
					Synthetic identity and action metadata only. No emails, notes, or clinical text.
				</p>
			</CardHeader>
			<CardContent>
				{events.isPending && (
					<div className="space-y-3" aria-busy="true">
						<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
						<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
						<span className="sr-only">Loading audit events</span>
					</div>
				)}

				{events.isError && (
					<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
						<p className="text-sm text-gray-700">
							{adminLoadErrorMessage(events.error, 'Unable to load audit events.')}
						</p>
						<Button type="button" className="mt-3" variant="outline" onClick={() => events.refetch()}>
							Retry
						</Button>
					</div>
				)}

				{!events.isPending && !events.isError && (events.data?.length ?? 0) === 0 && (
					<p className="text-sm text-gray-600">No audit events to display.</p>
				)}

				{!events.isPending && !events.isError && (events.data?.length ?? 0) > 0 && (
					<ul className="space-y-3" aria-label="Audit events">
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
