export type DocumentObjectIdentity = {
	practiceId: string;
	patientId: string;
	documentId: string;
};

export type StoredDocumentObject = {
	bytes: Buffer;
	contentType: string;
};

export interface DocumentObjectStore {
	put(identity: DocumentObjectIdentity, bytes: Buffer): Promise<string>;
	get(key: string, practiceId: string): Promise<Buffer>;
}

export const DOCUMENT_OBJECT_STORE = Symbol('DOCUMENT_OBJECT_STORE');
