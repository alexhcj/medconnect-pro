import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {planWebCommand, resolveWebMode} from './render-web.mjs';

const demoEnv = {
	RENDER_GIT_BRANCH: 'main',
	API_BASE_URL: 'https://api.example.test',
	NEXT_PUBLIC_USE_MOCKS: 'false',
};

describe('resolveWebMode', () => {
	it('is live only on the main branch outside a pull request', () => {
		assert.equal(resolveWebMode(demoEnv).mode, 'live');
	});

	it('uses mocks for a pull request, even on a main-looking branch', () => {
		assert.equal(resolveWebMode({...demoEnv, IS_PULL_REQUEST: 'true'}).mode, 'mocks');
	});

	it('fails closed when neither signal is present', () => {
		assert.equal(resolveWebMode({}).mode, 'mocks');
		assert.equal(resolveWebMode({IS_PULL_REQUEST: 'false'}).mode, 'mocks');
		assert.equal(resolveWebMode({RENDER_GIT_BRANCH: 'feature-x'}).mode, 'mocks');
	});
});

describe('planWebCommand', () => {
	const preview = {...demoEnv, IS_PULL_REQUEST: 'true'};

	it('builds the preview on mocks with no simulated faults', () => {
		const plan = planWebCommand('build', preview);
		assert.deepEqual(plan.args, ['run', 'build:mocks']);
		assert.equal(plan.env.NEXT_PUBLIC_USE_MOCKS, 'true');
		assert.equal(plan.env.NEXT_PUBLIC_MOCK_ERROR_RATE, '0');
		assert.equal(plan.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS, 'true');
		assert.equal(plan.env.NEXT_PUBLIC_DEPLOY_CONTEXT, 'pr-preview');
	});

	it('starts the preview without an API upstream', () => {
		const plan = planWebCommand('start', preview);
		assert.deepEqual(plan.args, ['run', 'start']);
		assert.equal('API_BASE_URL' in plan.env, false);
	});

	it('leaves the live demo build and start as they were', () => {
		const build = planWebCommand('build', demoEnv);
		assert.deepEqual(build.args, ['run', 'build:production']);
		assert.equal(build.env.NEXT_PUBLIC_USE_MOCKS, 'false');
		assert.equal('NEXT_PUBLIC_DEPLOY_CONTEXT' in build.env, false);
		const start = planWebCommand('start', demoEnv);
		assert.equal(start.env.API_BASE_URL, demoEnv.API_BASE_URL);
	});

	it('does not mutate the input env', () => {
		const input = {...preview};
		planWebCommand('start', input);
		assert.equal(input.API_BASE_URL, preview.API_BASE_URL);
	});

	it('rejects an unknown command', () => {
		assert.throws(() => planWebCommand('deploy', demoEnv), /Usage/);
	});
});
