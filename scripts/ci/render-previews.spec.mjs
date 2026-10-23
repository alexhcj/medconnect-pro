import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, it} from 'node:test';
import {fileURLToPath} from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const blueprint = readFileSync(path.join(repoRoot, 'render.yaml'), 'utf8');

function serviceBlock(name) {
	const blocks = blueprint.split(/^ {2}- type: /m).slice(1);
	const block = blocks.find((entry) => new RegExp(`^ {4}name: ${name}\\s*$`, 'm').test(entry));
	assert.ok(block, `render.yaml must define ${name}`);
	return block;
}

const rootOnly = blueprint.split(/^services:/m)[0];

describe('render.yaml previews (ADR-019)', () => {
	it('keeps preview environments off at the root', () => {
		assert.doesNotMatch(rootOnly.replace(/^\s*#.*$/gm, ''), /^previews:/m);
		assert.doesNotMatch(blueprint, /^previews:/m);
		assert.doesNotMatch(blueprint, /^ {0,2}previewsEnabled|\bpullRequestPreviewsEnabled\b/m);
	});

	it('gives the API and database no preview', () => {
		assert.doesNotMatch(serviceBlock('medconnect-api'), /\bpreviews:/);
		const database = blueprint.split(/^services:/m)[0].split(/^databases:/m)[1];
		assert.doesNotMatch(database, /\bpreviews:/);
	});

	it('enables manual previews on marketing and web only', () => {
		for (const name of ['medconnect-marketing', 'medconnect-web']) {
			assert.match(serviceBlock(name), /^ {4}previews:\s*\n {6}generation: manual\s*$/m, name);
		}
		assert.equal((blueprint.match(/generation:/g) ?? []).length, 2);
		assert.doesNotMatch(blueprint, /generation: automatic/);
	});

	it('builds and starts web only through render-web.mjs', () => {
		const web = serviceBlock('medconnect-web');
		assert.match(web, /^ {4}buildCommand: npm ci && node scripts\/infra\/render-web\.mjs build\s*$/m);
		assert.match(web, /^ {4}startCommand: node scripts\/infra\/render-web\.mjs start\s*$/m);
		assert.doesNotMatch(web, /buildCommand:.*build:production/);
		assert.match(web, /scripts\/infra\/render-web\.mjs\s*$/m);
	});

	it('builds marketing only through render-marketing.mjs', () => {
		const marketing = serviceBlock('medconnect-marketing');
		assert.match(
			marketing,
			/^ {4}buildCommand: npm ci && node scripts\/infra\/render-marketing\.mjs build\s*$/m,
		);
		assert.match(marketing, /^ {8}- scripts\/infra\/render-marketing\.mjs\s*$/m);
	});

	it('keeps API secrets and database variables off the web service', () => {
		const web = serviceBlock('medconnect-web');
		assert.doesNotMatch(web, /DATABASE_/);
		assert.doesNotMatch(web, /APP_ROLE_PASSWORD/);
		assert.doesNotMatch(web, /RATE_LIMIT_KEY_SECRET/);
		assert.doesNotMatch(web, /fromDatabase/);
	});

	it('keeps IS_PULL_REQUEST out of the Blueprint env (only render-web.mjs reads it)', () => {
		assert.doesNotMatch(blueprint.replace(/^\s*#.*$/gm, ''), /IS_PULL_REQUEST/);
	});

	it('deploys every service only after ci passes (INFRA-020)', () => {
		for (const name of ['medconnect-api', 'medconnect-web', 'medconnect-marketing']) {
			assert.match(serviceBlock(name), /^ {4}autoDeployTrigger: checksPass\s*$/m, name);
		}
		assert.equal((blueprint.match(/autoDeployTrigger:/g) ?? []).length, 3);
	});
});
