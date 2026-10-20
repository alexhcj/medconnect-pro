'use client';

import {PagedEventList} from '@/components/admin/paged-event-list';
import {
	AUDIT_ACTION_OPTIONS,
	AUDIT_RESOURCE_TYPE_OPTIONS,
} from '@/lib/admin/event-filter-options';
import {useAuditEvents} from '@/lib/hooks/use-admin';

export function AuditEventViewer() {
	return (
		<PagedEventList
			prefix="audit"
			title="Audit events"
			description="Synthetic identity and action metadata only. No emails, notes, or clinical text."
			loadingLabel="Loading audit events"
			emptyMessage="No audit events to display."
			errorMessage="Unable to load audit events."
			actionOptions={AUDIT_ACTION_OPTIONS}
			resourceTypeOptions={AUDIT_RESOURCE_TYPE_OPTIONS}
			useEvents={useAuditEvents}
		/>
	);
}
