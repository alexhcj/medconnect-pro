import {describe, expect, it} from 'vitest';
import {assertDocumentStorageKey, documentStorageKey} from './document-storage-key.js';

const practiceId = '11111111-1111-4111-8111-111111111111';
const patientId = '22222222-2222-4222-8222-222222222222';
const documentId = '33333333-3333-4333-8333-333333333333';

describe('document storage keys', () => {
	it('builds a tenant-prefixed object key', () => {
		expect(documentStorageKey(practiceId, patientId, documentId)).toBe(
			`practices/${practiceId}/patients/${patientId}/${documentId}`,
		);
	});

	it('rejects a key that does not start with the request practice', () => {
		const other = '44444444-4444-4444-8444-444444444444';
		expect(() =>
			assertDocumentStorageKey(`practices/${other}/patients/${patientId}/${documentId}`, practiceId),
		).toThrow(/tenant scope/);
	});

	it('rejects path traversal in a storage key', () => {
		expect(() => assertDocumentStorageKey(`practices/${practiceId}/../secret`, practiceId)).toThrow(
			/Invalid document storage key/,
		);
	});
});
