import {formatDateTime} from '@/lib/format/date';

export function formatAuditDate(iso: string): string {
	return formatDateTime(iso);
}
