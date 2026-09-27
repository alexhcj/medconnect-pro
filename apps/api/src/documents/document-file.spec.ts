import {describe, expect, it} from 'vitest';
import {MAX_DOCUMENT_BYTES, sanitizeDocumentName, sniffDocumentContentType, syntheticPdfBytes, validateUploadedDocument} from './document-file.js';
import {DocumentFileInvalidError} from './document.errors.js';

const png = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
	'base64',
);

describe('document file validation', () => {
	it('sniffs PDF, PNG, and JPEG magic bytes', () => {
		expect(sniffDocumentContentType(syntheticPdfBytes())).toBe('application/pdf');
		expect(sniffDocumentContentType(png)).toBe('image/png');
		expect(sniffDocumentContentType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
		expect(sniffDocumentContentType(Buffer.from('not-a-file'))).toBeUndefined();
	});

	it('sanitizes names and rejects empty or parent-directory names', () => {
		expect(sanitizeDocumentName('C:\\\\temp\\\\Intake summary.pdf')).toBe('Intake summary.pdf');
		expect(sanitizeDocumentName('a/b/notes.png')).toBe('notes.png');
		expect(sanitizeDocumentName('../secret.pdf')).toBe('secret.pdf');
		expect(() => sanitizeDocumentName('..')).toThrow(DocumentFileInvalidError);
		expect(() => sanitizeDocumentName('')).toThrow(DocumentFileInvalidError);
	});

	it('rejects missing, oversized, and spoofed files', () => {
		expect(() => validateUploadedDocument(undefined)).toThrow(DocumentFileInvalidError);
		expect(() =>
			validateUploadedDocument({
				buffer: Buffer.concat([syntheticPdfBytes(), Buffer.alloc(MAX_DOCUMENT_BYTES)]),
				originalname: 'huge.pdf',
			}),
		).toThrow(/5 MiB/);
		expect(() =>
			validateUploadedDocument({buffer: Buffer.from('hello'), originalname: 'notes.pdf'}),
		).toThrow(/PDF, PNG, or JPEG/);
	});

	it('accepts a sniffed PDF and ignores a spoofed content type in the name', () => {
		const result = validateUploadedDocument({
			buffer: syntheticPdfBytes(),
			originalname: 'intake.txt',
		});
		expect(result.contentType).toBe('application/pdf');
		expect(result.name).toBe('intake.txt');
	});
});
