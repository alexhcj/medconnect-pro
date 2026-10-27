import assert from 'node:assert/strict';
import test from 'node:test';
import {checkCopy, checkRegistry, checkVersion, readFrontMatterScalars} from './check-marketing-sync.mjs';

test('checkVersion passes when matrix matches package version', () => {
	assert.deepEqual(checkVersion({packageVersion: '1.2.3', matrix: 'x\nLast synced release: 1.2.3\n'}), []);
});

test('checkVersion fails on drift or missing line', () => {
	assert.equal(checkVersion({packageVersion: '1.2.4', matrix: 'Last synced release: 1.2.3\n'}).length, 1);
	assert.equal(checkVersion({packageVersion: '1.2.3', matrix: 'nothing'}).length, 1);
});

test('readFrontMatterScalars reads marketing_path and strips comments', () => {
	const data = readFrontMatterScalars('---\nid: x\nmarketing_path: /platform/x  # note\n---\nbody');
	assert.equal(data.marketing_path, '/platform/x');
});

test('checkRegistry flags unlinked modules and missing routes', () => {
	const failures = checkRegistry({
		modules: [{file: 'a.md', data: {marketing_path: '/platform/a'}}],
		matrix: 'no links',
		routeExists: () => false,
	});
	assert.equal(failures.length, 2);
	assert.deepEqual(
		checkRegistry({
			modules: [{file: 'a.md', data: {marketing_path: '/login'}}],
			matrix: '(../product/a.md)',
			routeExists: () => false,
		}),
		[],
	);
});

test('checkCopy flags stale phrases and missing ceilings', () => {
	const failures = checkCopy({
		copyFiles: [{name: 'marketing-about-copy.ts', content: "title: 'M0–M7 shipped'"}],
	});
	assert.equal(failures.length, 2);
	assert.deepEqual(
		checkCopy({copyFiles: [{name: 'marketing-about-copy.ts', content: 'is not HIPAA certified'}]}),
		[],
	);
});
