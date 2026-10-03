import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
	findAccessKeyViolations,
	findComposeCredentialViolations,
	inspectTrackedFile,
	isComposeCredentialAllowlisted,
	isTrackedEnvFile,
} from './reject-committed-secrets.mjs';

const composeRuntime = 'postgresql://medconnect_app:medconnect_app@127.0.0.1:5432/medconnect';
const fakeAccessKey = `AKIA${'0'.repeat(16)}`;
const fakeSecretLine = `AWS_SECRET_ACCESS_KEY=${'A'.repeat(40)}`;

describe('isTrackedEnvFile', () => {
	it('rejects committed .env copies and allows examples', () => {
		assert.equal(isTrackedEnvFile('.env'), true);
		assert.equal(isTrackedEnvFile('apps/api/.env.preview'), true);
		assert.equal(isTrackedEnvFile('apps/api/.env.production'), true);
		assert.equal(isTrackedEnvFile('apps/api/.env.example'), false);
		assert.equal(isTrackedEnvFile('apps/api/.env.preview.example'), false);
		assert.equal(isTrackedEnvFile('apps/web/.env.production.example'), false);
	});
});

describe('compose allowlist', () => {
	it('allows local demo locations and docs', () => {
		assert.equal(isComposeCredentialAllowlisted('docker-compose.yml'), true);
		assert.equal(isComposeCredentialAllowlisted('docs/contracts/environment-configuration.md'), true);
		assert.equal(isComposeCredentialAllowlisted('infra/terraform/secrets.tf'), false);
		assert.equal(isComposeCredentialAllowlisted('apps/api/.env.preview.example'), false);
	});
});

describe('finders', () => {
	it('detects Compose markers and AWS key material', () => {
		assert.deepEqual(findComposeCredentialViolations(composeRuntime), [
			'medconnect_app:medconnect_app',
			'postgresql://medconnect_app:medconnect_app@',
		]);
		assert.deepEqual(findAccessKeyViolations(fakeAccessKey), ['AWS access key id (AKIA…)']);
		assert.deepEqual(findAccessKeyViolations(fakeSecretLine), [
			'AWS_SECRET_ACCESS_KEY assignment with a value',
		]);
		assert.deepEqual(findAccessKeyViolations('Do not store AWS_SECRET_ACCESS_KEY as GitHub Secrets'), []);
	});
});

describe('inspectTrackedFile', () => {
	it('fails hosted examples and Terraform that copy Compose passwords', () => {
		const hosted = inspectTrackedFile('apps/api/.env.preview.example', composeRuntime);
		assert.ok(hosted.some((line) => line.includes('Compose demo credentials')));
		const terraform = inspectTrackedFile('infra/terraform/secrets.tf', composeRuntime);
		assert.ok(terraform.some((line) => line.includes('Compose demo credentials')));
	});

	it('allows Compose defaults in the documented local files', () => {
		assert.deepEqual(inspectTrackedFile('apps/api/.env.example', composeRuntime), []);
		assert.deepEqual(
			inspectTrackedFile('docs/contracts/environment-configuration.md', composeRuntime),
			[],
		);
	});
});
