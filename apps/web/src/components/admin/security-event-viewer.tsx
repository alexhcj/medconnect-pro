'use client';

import {PagedEventList} from '@/components/admin/paged-event-list';
import {
	SECURITY_ACTION_OPTIONS,
	SECURITY_RESOURCE_TYPE_OPTIONS,
} from '@/lib/admin/event-filter-options';
import {useSecurityEvents} from '@/lib/hooks/use-admin';

export function SecurityEventViewer() {
	return (
		<PagedEventList
			prefix="security"
			title="Security events"
			description="Tenant-scoped authentication and session events. Synthetic ids only. Not a SIEM or HIPAA audit export."
			loadingLabel="Loading security events"
			emptyMessage="No security events to display."
			errorMessage="Unable to load security events."
			actionOptions={SECURITY_ACTION_OPTIONS}
			resourceTypeOptions={SECURITY_RESOURCE_TYPE_OPTIONS}
			useEvents={useSecurityEvents}
		/>
	);
}
