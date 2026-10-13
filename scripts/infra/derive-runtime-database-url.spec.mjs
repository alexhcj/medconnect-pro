import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {deriveRuntimeDatabaseUrl} from './derive-runtime-database-url.mjs';

const adminUrl =
	'postgresql://medconnect:owner-secret@db.internal:5432/medconnect?sslmode=require';

describe('deriveRuntimeDatabaseUrl', () => {
	it('replaces the owner login and keeps the host, database, and query', () => {
		const derived = deriveRuntimeDatabaseUrl(adminUrl, 'app-secret');
		const parsed = new URL(derived);
		assert.equal(decodeURIComponent(parsed.username), 'medconnect_app');
		assert.equal(decodeURIComponent(parsed.password), 'app-secret');
		assert.equal(parsed.hostname, 'db.internal');
		assert.equal(parsed.port, '5432');
		assert.equal(parsed.pathname, '/medconnect');
		assert.equal(parsed.searchParams.get('sslmode'), 'require');
		assert.notEqual(derived, adminUrl);
	});

	it('encodes a password without putting the owner secret in the result', () => {
		const derived = deriveRuntimeDatabaseUrl(adminUrl, 'p@ss word');
		const parsed = new URL(derived);
		assert.equal(decodeURIComponent(parsed.password), 'p@ss word');
		assert.equal(derived.includes('owner-secret'), false);
	});

	it('refuses an empty password without echoing the admin URL', () => {
		assert.throws(() => deriveRuntimeDatabaseUrl(adminUrl, '  '), (error) => {
			assert.match(error.message, /APP_ROLE_PASSWORD is required/);
			assert.equal(error.message.includes('owner-secret'), false);
			assert.equal(error.message.includes('://'), false);
			return true;
		});
	});

	it('refuses the runtime role as the owner login', () => {
		assert.throws(
			() =>
				deriveRuntimeDatabaseUrl(
					'postgresql://medconnect_app:runtime-secret@db.internal:5432/medconnect',
					'app-secret',
				),
			(error) => {
				assert.match(error.message, /must not use the medconnect_app runtime role/);
				assert.equal(error.message.includes('runtime-secret'), false);
				assert.equal(error.message.includes('app-secret'), false);
				return true;
			},
		);
	});
});
