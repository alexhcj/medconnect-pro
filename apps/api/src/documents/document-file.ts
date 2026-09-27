import {
	DOCUMENT_CONTENT_TYPES,
	type DocumentContentType,
} from '../persistence/entities/patient-document.entity.js';
import {DocumentFileInvalidError} from './document.errors.js';

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function sniffDocumentContentType(bytes: Buffer): DocumentContentType | undefined {
	if (bytes.length >= 5 && bytes.subarray(0, 4).equals(Buffer.from('%PDF'))) {
		return 'application/pdf';
	}
	if (bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
		return 'image/png';
	}
	if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return 'image/jpeg';
	}
	return undefined;
}

export function sanitizeDocumentName(originalName: string | undefined): string {
	const base = (originalName ?? '').replaceAll('\\', '/').split('/').pop() ?? '';
	const cleaned = [...base]
		.filter((character) => {
			const code = character.charCodeAt(0);
			return code >= 32 && code !== 127 && !'<>:"|?*'.includes(character);
		})
		.join('')
		.trim();
	if (!cleaned || cleaned === '.' || cleaned === '..') {
		throw new DocumentFileInvalidError('file', 'A file name is required');
	}
	return cleaned.slice(0, 200);
}

export function validateUploadedDocument(file: {buffer: Buffer; originalname?: string} | undefined): {
	bytes: Buffer;
	contentType: DocumentContentType;
	name: string;
} {
	if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
		throw new DocumentFileInvalidError('file', 'A file is required');
	}
	if (file.buffer.length > MAX_DOCUMENT_BYTES) {
		throw new DocumentFileInvalidError('file', 'File must be 5 MiB or smaller');
	}
	const contentType = sniffDocumentContentType(file.buffer);
	if (!contentType || !DOCUMENT_CONTENT_TYPES.includes(contentType)) {
		throw new DocumentFileInvalidError('file', 'File must be a PDF, PNG, or JPEG');
	}
	return {
		bytes: file.buffer,
		contentType,
		name: sanitizeDocumentName(file.originalname),
	};
}

export function syntheticPdfBytes(): Buffer {
	return Buffer.from('%PDF-1.1\n1 0 obj<</Type/Catalog>>endobj\ntrailer<>\n%%EOF\n');
}
