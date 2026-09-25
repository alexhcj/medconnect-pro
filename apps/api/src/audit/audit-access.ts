export function resourceTypeFromPath(path: string): string {
	const normalized = path.split('?')[0] ?? path;
	const segment = normalized.replace(/^\/+/, '').split('/')[0]?.trim();
	if (!segment) {
		return 'unknown';
	}
	return segment.slice(0, 80);
}
