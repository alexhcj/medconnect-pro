#!/usr/bin/env node
/**
 * Read-only drift check between the product registry, the marketing capability matrix, the
 * marketing copy, and the root version. Never generates marketing content.
 */

import {existsSync, readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const COPY_DIR = 'apps/marketing/src/components/marketing';
const ROUTES_DIR = 'apps/marketing/src/app/(marketing)';

/** Phrases that were true once and must not come back. */
export const STALE_PHRASES = [
	'M0–M7',
	'Not this milestone',
	'are a later milestone',
	'Security-events HTTP is not shipped',
];

/** Claim ceilings that must stay on the site. */
export const REQUIRED_PHRASES = [{file: 'marketing-about-copy.ts', phrase: 'not HIPAA certified'}];

export function readFrontMatterScalars(source) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
	const data = {};
	if (!match) return data;
	for (const line of match[1].split(/\r?\n/)) {
		const m = /^([a-z_]+):\s*(.+?)\s*$/.exec(line);
		if (m) data[m[1]] = m[2].replace(/\s+#.*$/, '').replace(/^"(.*)"$/, '$1');
	}
	return data;
}

export function checkVersion({packageVersion, matrix}) {
	const m = /^Last synced release:\s*(\S+)\s*$/m.exec(matrix);
	if (!m) return ['capability-matrix.md: missing "Last synced release: x.y.z" line'];
	if (m[1] !== packageVersion) {
		return [
			`capability-matrix.md: Last synced release ${m[1]} != root package.json ${packageVersion}; re-audit marketing copy and update the line`,
		];
	}
	return [];
}

export function checkRegistry({modules, matrix, routeExists}) {
	const failures = [];
	for (const {file, data} of modules) {
		if (!matrix.includes(`product/${file}`)) {
			failures.push(`capability-matrix.md: no row links product/${file}`);
		}
		const route = data.marketing_path;
		if (route && route !== '/login' && !routeExists(route)) {
			failures.push(`docs/product/${file}: marketing_path ${route} has no page in apps/marketing`);
		}
	}
	return failures;
}

export function checkCopy({copyFiles}) {
	const failures = [];
	for (const {name, content} of copyFiles) {
		for (const phrase of STALE_PHRASES) {
			if (content.includes(phrase)) failures.push(`${name}: stale phrase "${phrase}"`);
		}
	}
	for (const {file, phrase} of REQUIRED_PHRASES) {
		const entry = copyFiles.find((f) => f.name === file);
		if (!entry || !entry.content.includes(phrase)) {
			failures.push(`${file}: required claim ceiling "${phrase}" is missing`);
		}
	}
	return failures;
}

function main() {
	const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
	const read = (rel) => readFileSync(path.join(root, rel), 'utf8');
	const matrix = read('docs/marketing/capability-matrix.md');
	const modules = readdirSync(path.join(root, 'docs/product'))
		.filter((f) => f.endsWith('.md') && f !== 'README.md')
		.map((file) => ({file, data: readFrontMatterScalars(read(`docs/product/${file}`))}));
	const copyFiles = readdirSync(path.join(root, COPY_DIR))
		.filter((f) => /-copy\.ts$/.test(f))
		.map((name) => ({name, content: read(`${COPY_DIR}/${name}`)}));

	const failures = [
		...checkVersion({packageVersion: JSON.parse(read('package.json')).version, matrix}),
		...checkRegistry({
			modules,
			matrix,
			routeExists: (route) => existsSync(path.join(root, ROUTES_DIR, ...route.split('/').filter(Boolean))),
		}),
		...checkCopy({copyFiles}),
	];

	if (failures.length > 0) {
		console.error('Marketing sync check failed:');
		for (const f of failures) console.error(`  - ${f}`);
		process.exitCode = 1;
		return;
	}
	console.log('Marketing sync check passed.');
}

const invokedAsCli =
	process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsCli) main();
