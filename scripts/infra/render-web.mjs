#!/usr/bin/env node
/**
 * Render web build and start (INFRA-019, ADR-019). One place decides whether
 * medconnect-web is the live demo or a PR preview, so application code never
 * reads provider variables. Fails closed: live mode needs an explicit signal
 * (not a pull request, and the Blueprint branch). Anything else builds on
 * frontend mocks and starts without an API upstream. Does not log env values.
 */

import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const LIVE_BRANCH = 'main';

export function resolveWebMode(env) {
	if (env.IS_PULL_REQUEST === 'true') {
		return {mode: 'mocks', reason: 'IS_PULL_REQUEST'};
	}
	if (env.RENDER_GIT_BRANCH === LIVE_BRANCH) {
		return {mode: 'live', reason: 'main branch'};
	}
	return {mode: 'mocks', reason: 'live signal missing'};
}

const MOCK_BUILD_ENV = {
	NEXT_PUBLIC_USE_MOCKS: 'true',
	NEXT_PUBLIC_MOCK_ERROR_RATE: '0',
	NEXT_PUBLIC_MOCK_DELAY: '150',
	NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS: 'true',
	NEXT_PUBLIC_DEPLOY_CONTEXT: 'pr-preview',
};

export function planWebCommand(command, env) {
	const {mode, reason} = resolveWebMode(env);
	const childEnv = {...env};
	let script;
	if (command === 'build') {
		script = mode === 'live' ? 'build:production' : 'build:mocks';
		if (mode === 'mocks') Object.assign(childEnv, MOCK_BUILD_ENV);
	} else if (command === 'start') {
		script = 'start';
		if (mode === 'mocks') delete childEnv.API_BASE_URL;
	} else {
		throw new Error('Usage: render-web.mjs build|start');
	}
	return {mode, reason, args: ['run', script], env: childEnv};
}

function main() {
	let plan;
	try {
		plan = planWebCommand(process.argv[2], process.env);
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
	console.log(`render-web: mode=${plan.mode} reason=${plan.reason}`);
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
