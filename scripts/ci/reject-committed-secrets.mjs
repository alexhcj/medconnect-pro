#!/usr/bin/env node
/**
 * Fail if tracked files leak real env files, AWS access-key material, or Compose
 * demo credentials into hosted/Terraform paths. Quality CI only — no AWS calls.
 */

import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ACCESS_KEY_ID = /AKIA[0-9A-Z]{16}/;
const SECRET_ACCESS_KEY_ASSIGNMENT =
	/AWS_SECRET_ACCESS_KEY\s*[=:]\s*(?:['"]?)(?!<)(?!['"]?\s*$)([A-Za-z0-9/+=]{20,})/;

const COMPOSE_CREDENTIAL_MARKERS = [
	'medconnect_app:medconnect_app',
	'medconnect:medconnect',
	'postgresql://medconnect_app:medconnect_app@',
	'postgresql://medconnect:medconnect@',
	'postgres://medconnect_app:medconnect_app@',
	'postgres://medconnect:medconnect@',
];

const COMPOSE_ALLOWLIST = new Set([
	'docker-compose.yml',
	'.github/workflows/ci.yml',
	'apps/api/.env.example',
	'apps/api/src/persistence/default-database-url.ts',
	'apps/api/src/platform/env.schema.spec.ts',
	'scripts/ci/reject-committed-secrets.mjs',
	'scripts/ci/reject-committed-secrets.spec.mjs',
]);

function posixPath(filePath) {
	return filePath.split(path.sep).join('/');
}

export function isExampleEnvBasename(basename) {
	return basename.startsWith('.env') && basename.endsWith('.example');
}

export function isTrackedEnvFile(filePath) {
	const basename = path.posix.basename(posixPath(filePath));
	if (!basename.startsWith('.env')) {
		return false;
	}
	return !isExampleEnvBasename(basename);
}

export function isComposeCredentialAllowlisted(filePath) {
	const normalized = posixPath(filePath);
	if (COMPOSE_ALLOWLIST.has(normalized)) {
		return true;
	}
	return normalized.startsWith('docs/');
}

export function findAccessKeyViolations(content) {
	const violations = [];
	if (ACCESS_KEY_ID.test(content)) {
		violations.push('AWS access key id (AKIA…)');
	}
	if (SECRET_ACCESS_KEY_ASSIGNMENT.test(content)) {
		violations.push('AWS_SECRET_ACCESS_KEY assignment with a value');
	}
	return violations;
}

export function findComposeCredentialViolations(content) {
	return COMPOSE_CREDENTIAL_MARKERS.filter((marker) => content.includes(marker));
}

function isLikelyBinary(buffer) {
	return buffer.includes(0);
}

export function inspectTrackedFile(filePath, content) {
	const findings = [];
	if (isTrackedEnvFile(filePath)) {
		findings.push('tracked non-example .env file');
	}
	findings.push(...findAccessKeyViolations(content));
	if (!isComposeCredentialAllowlisted(filePath)) {
		const markers = findComposeCredentialViolations(content);
		if (markers.length > 0) {
			findings.push(`Compose demo credentials (${markers.join(', ')})`);
		}
	}
	return findings;
}

export function listTrackedFiles() {
	const output = execFileSync('git', ['ls-files', '-z'], {encoding: 'buffer'});
	const text = output.toString('utf8');
	return text.split('\0').filter(Boolean);
}

function main() {
	const files = listTrackedFiles();
	const failures = [];

	for (const filePath of files) {
		if (isTrackedEnvFile(filePath)) {
			failures.push(`${filePath}: tracked non-example .env file`);
			continue;
		}

		let buffer;
		try {
			buffer = readFileSync(filePath);
		} catch {
			continue;
		}
		if (isLikelyBinary(buffer)) {
			continue;
		}

		const content = buffer.toString('utf8');
		for (const finding of inspectTrackedFile(filePath, content)) {
			if (finding === 'tracked non-example .env file') {
				continue;
			}
			failures.push(`${filePath}: ${finding}`);
		}
	}

	if (failures.length > 0) {
		console.error('Committed secret guard failed:');
		for (const line of failures) {
			console.error(`  ${line}`);
		}
		process.exitCode = 1;
		return;
	}

	console.log(`Committed secret guard passed (${files.length} tracked files).`);
}

const invokedAsCli =
	process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedAsCli) {
	main();
}
