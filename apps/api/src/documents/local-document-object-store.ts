import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, join, resolve, sep} from 'node:path';
import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import type {Env} from '../platform/env.schema.js';
import type {
	DocumentObjectIdentity,
	DocumentObjectStore,
} from './document-object-store.js';
import {assertDocumentStorageKey, documentStorageKey} from './document-storage-key.js';

@Injectable()
export class LocalDocumentObjectStore implements DocumentObjectStore {
	constructor(private readonly config: ConfigService<Env, true>) {}

	async put(identity: DocumentObjectIdentity, bytes: Buffer): Promise<string> {
		const key = documentStorageKey(identity.practiceId, identity.patientId, identity.documentId);
		const path = this.resolvePath(key, identity.practiceId);
		await mkdir(dirname(path), {recursive: true});
		await writeFile(path, bytes);
		return key;
	}

	async get(key: string, practiceId: string): Promise<Buffer> {
		const path = this.resolvePath(key, practiceId);
		return readFile(path);
	}

	private resolvePath(key: string, practiceId: string): string {
		assertDocumentStorageKey(key, practiceId);
		const root = resolve(this.config.get('DOCUMENT_STORAGE_DIR', {infer: true}));
		const full = resolve(join(root, key));
		const prefix = root.endsWith(sep) ? root : `${root}${sep}`;
		if (full !== root && !full.startsWith(prefix)) {
			throw new Error('Document storage path escaped the storage root');
		}
		return full;
	}
}
