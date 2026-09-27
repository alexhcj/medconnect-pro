export function formatAuditDate(iso: string): string {
	return new Date(iso).toLocaleString();
}
