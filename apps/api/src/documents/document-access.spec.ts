import {describe, expect, it} from 'vitest';
import {canReadDocuments, canUploadDocuments} from './document-access.js';

describe('document access', () => {
	it('grants uploads to providers and super admins only', () => {
		expect(canUploadDocuments('PROVIDER')).toBe(true);
		expect(canUploadDocuments('SUPER_ADMIN')).toBe(true);
		expect(canUploadDocuments('NURSE')).toBe(false);
		expect(canUploadDocuments('PRACTICE_ADMIN')).toBe(false);
		expect(canUploadDocuments('RECEPTIONIST')).toBe(false);
		expect(canUploadDocuments('PATIENT')).toBe(false);
	});

	it('lets portal users read without a write grant', () => {
		expect(canReadDocuments('PATIENT')).toBe(true);
		expect(canReadDocuments('PROVIDER')).toBe(true);
		expect(canReadDocuments('NURSE')).toBe(false);
		expect(canReadDocuments('PRACTICE_ADMIN')).toBe(false);
		expect(canReadDocuments('RECEPTIONIST')).toBe(false);
	});
});
