import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
	buildEnsureAppRoleSql,
	postgresSslConfig,
	requireEnv,
	sqlStringLiteral,
} from './ensure-app-role.mjs';

describe('requireEnv', () => {
	it('returns the named value', () => {
		assert.equal(requireEnv('APP_ROLE_PASSWORD', {APP_ROLE_PASSWORD: 'secret'}), 'secret');
	});

	it('rejects missing or empty values', () => {
		assert.throws(() => requireEnv('APP_ROLE_PASSWORD', {}), /APP_ROLE_PASSWORD is required/);
		assert.throws(
			() => requireEnv('DATABASE_ADMIN_URL', {DATABASE_ADMIN_URL: ''}),
			/DATABASE_ADMIN_URL is required/,
		);
	});
});

describe('sqlStringLiteral', () => {
	it('quotes and doubles embedded single quotes', () => {
		assert.equal(sqlStringLiteral(`o'reilly`), `'o''reilly'`);
	});
});

describe('buildEnsureAppRoleSql', () => {
	it('creates the non-owner role if missing then always alters the password', () => {
		const [create, alter] = buildEnsureAppRoleSql(`p'ass`);
		assert.match(create, /CREATE ROLE medconnect_app LOGIN PASSWORD 'p''ass'/);
		assert.match(create, /NOBYPASSRLS/);
		assert.equal(alter, `ALTER ROLE medconnect_app PASSWORD 'p''ass';`);
	});
});

describe('postgresSslConfig', () => {
	it('omits ssl when no RDS hostname is supplied', () => {
		assert.equal(postgresSslConfig(undefined), undefined);
		assert.equal(postgresSslConfig(''), undefined);
	});

	it('verifies TLS against the RDS hostname without disabling rejection', () => {
		assert.deepEqual(postgresSslConfig('preview.xxxx.us-east-1.rds.amazonaws.com'), {
			rejectUnauthorized: true,
			servername: 'preview.xxxx.us-east-1.rds.amazonaws.com',
		});
	});
});
