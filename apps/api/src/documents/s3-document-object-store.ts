import {
	GetObjectCommand,
	PutObjectCommand,
	type S3Client,
} from '@aws-sdk/client-s3';
import type {DocumentObjectIdentity, DocumentObjectStore} from './document-object-store.js';
import {assertDocumentStorageKey, documentStorageKey} from './document-storage-key.js';

export type DocumentS3Client = Pick<S3Client, 'send'>;

export class S3DocumentObjectStore implements DocumentObjectStore {
	constructor(
		private readonly bucket: string,
		private readonly s3: DocumentS3Client,
	) {}

	async put(identity: DocumentObjectIdentity, bytes: Buffer): Promise<string> {
		const key = documentStorageKey(identity.practiceId, identity.patientId, identity.documentId);
		await this.s3.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: bytes,
			}),
		);
		return key;
	}

	async get(key: string, practiceId: string): Promise<Buffer> {
		assertDocumentStorageKey(key, practiceId);
		const response = await this.s3.send(
			new GetObjectCommand({
				Bucket: this.bucket,
				Key: key,
			}),
		);
		const body = response.Body;
		if (!body || typeof body.transformToByteArray !== 'function') {
			throw new Error('Document object body is missing');
		}
		return Buffer.from(await body.transformToByteArray());
	}
}
