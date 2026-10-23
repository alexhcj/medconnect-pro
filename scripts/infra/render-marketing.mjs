#!/usr/bin/env node
/**
 * Render marketing build (FE-048, ADR-019). Marks a PR preview build with the
 * provider-neutral NEXT_PUBLIC_DEPLOY_CONTEXT so application code never reads
 * Render variables. Only IS_PULL_REQUEST=true sets it; any other build (the
 * live site, or a missing signal) deletes it so the banner stays absent.
 * Does not log env values.
 */

import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function planMarketingBuild(command, env) {
	if (command !== 'build') {
		throw new Error('Usage: render-marketing.mjs build');
	}
	const childEnv = {...env};
	const preview = env.IS_PULL_REQUEST === 'true';
	if (preview) {
		childEnv.NEXT_PUBLIC_DEPLOY_CONTEXT = 'pr-preview';
	} else {
		delete childEnv.NEXT_PUBLIC_DEPLOY_CONTEXT;
	}
	return {mode: preview ? 'preview' : 'live', args: ['run', 'build:marketing'], env: childEnv};
}

function main() {
	let plan;
	try {
		plan = planMarketingBuild(process.argv[2], process.env);
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
	console.log(`render-marketing: mode=${plan.mode}`);
	const child = spawn('npm', plan.args, {
		cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
		env: plan.env,
		stdio: 'inherit',
		shell: process.platform === 'win32',
	});
	for (const signal of ['SIGTERM', 'SIGINT']) {
		process.on(signal, () => child.kill(signal));
	}
	child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main();
}
