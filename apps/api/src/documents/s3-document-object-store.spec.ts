import {GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3';
import {describe, expect, it, vi} from 'vitest';
import {S3DocumentObjectStore} from './s3-document-object-store.js';

const practiceId = '11111111-1111-4111-8111-111111111111';
const patientId = '22222222-2222-4222-8222-222222222222';
const documentId = '33333333-3333-4333-8333-333333333333';
const storageKey = `practices/${practiceId}/patients/${patientId}/${documentId}`;
const bytes = Buffer.from('%PDF-1.4 synthetic');

describe('S3DocumentObjectStore', () => {
	it('puts an object under the tenant-prefixed key', async () => {
		const send = vi.fn().mockResolvedValue({});
		const store = new S3DocumentObjectStore('medconnect-preview-documents-example', {send});
		await expect(store.put({practiceId, patientId, documentId}, bytes)).resolves.toBe(storageKey);
		expect(send).toHaveBeenCalledTimes(1);
		const command = send.mock.calls[0][0];
		expect(command).toBeInstanceOf(PutObjectCommand);
		expect(command.input).toEqual({
			Bucket: 'medconnect-preview-documents-example',
			Key: storageKey,
			Body: bytes,
		});
	});

	it('gets an object after asserting tenant scope', async () => {
		const send = vi.fn().mockResolvedValue({
			Body: {
				transformToByteArray: async () => new Uint8Array(bytes),
			},
		});
		const store = new S3DocumentObjectStore('medconnect-preview-documents-example', {send});
		await expect(store.get(storageKey, practiceId)).resolves.toEqual(bytes);
		expect(send).toHaveBeenCalledTimes(1);
		const command = send.mock.calls[0][0];
		expect(command).toBeInstanceOf(GetObjectCommand);
		expect(command.input).toEqual({
			Bucket: 'medconnect-preview-documents-example',
			Key: storageKey,
		});
	});

	it('does not fetch when the storage key is outside the tenant', async () => {
		const send = vi.fn();
		const store = new S3DocumentObjectStore('medconnect-preview-documents-example', {send});
		const otherPractice = '44444444-4444-4444-8444-444444444444';
		await expect(
			store.get(`practices/${otherPractice}/patients/${patientId}/${documentId}`, practiceId),
		).rejects.toThrow(/tenant scope/);
		expect(send).not.toHaveBeenCalled();
	});
});
