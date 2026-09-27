const UUID =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function documentStorageKey(
	practiceId: string,
	patientId: string,
	documentId: string,
): string {
	assertUuid(practiceId, 'practiceId');
	assertUuid(patientId, 'patientId');
	assertUuid(documentId, 'documentId');
	return `practices/${practiceId}/patients/${patientId}/${documentId}`;
}

export function assertDocumentStorageKey(key: string, practiceId: string): void {
	assertUuid(practiceId, 'practiceId');
	if (key.includes('..') || key.includes('\\') || key.startsWith('/')) {
		throw new Error('Invalid document storage key');
	}
	const expectedPrefix = `practices/${practiceId}/`;
	if (!key.startsWith(expectedPrefix)) {
		throw new Error('Document storage key is outside the tenant scope');
	}
}

function assertUuid(value: string, label: string): void {
	if (!UUID.test(value)) {
		throw new Error(`Invalid ${label} for document storage`);
	}
}
