import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {planMarketingBuild} from './render-marketing.mjs';

const siteEnv = {
	RENDER_GIT_BRANCH: 'main',
	NEXT_PUBLIC_SITE_URL: 'https://marketing.example.test',
};

describe('planMarketingBuild', () => {
	it('marks a pull request build as a PR preview', () => {
		const plan = planMarketingBuild('build', {...siteEnv, IS_PULL_REQUEST: 'true'});
		assert.equal(plan.mode, 'preview');
		assert.deepEqual(plan.args, ['run', 'build:marketing']);
		assert.equal(plan.env.NEXT_PUBLIC_DEPLOY_CONTEXT, 'pr-preview');
		assert.equal(plan.env.NEXT_PUBLIC_SITE_URL, siteEnv.NEXT_PUBLIC_SITE_URL);
	});

	it('leaves the live build unmarked', () => {
		const plan = planMarketingBuild('build', siteEnv);
		assert.equal(plan.mode, 'live');
		assert.equal('NEXT_PUBLIC_DEPLOY_CONTEXT' in plan.env, false);
	});

	it('does not mark a build when the signal is missing or not exactly true', () => {
		for (const value of [undefined, 'false', 'TRUE', '1', '']) {
			const plan = planMarketingBuild('build', {...siteEnv, IS_PULL_REQUEST: value});
			assert.equal('NEXT_PUBLIC_DEPLOY_CONTEXT' in plan.env, false, String(value));
		}
	});

	it('removes a stray context value from a live build', () => {
		const plan = planMarketingBuild('build', {...siteEnv, NEXT_PUBLIC_DEPLOY_CONTEXT: 'pr-preview'});
		assert.equal('NEXT_PUBLIC_DEPLOY_CONTEXT' in plan.env, false);
	});

	it('does not mutate the input env', () => {
		const input = {...siteEnv, IS_PULL_REQUEST: 'true'};
		planMarketingBuild('build', input);
		assert.equal('NEXT_PUBLIC_DEPLOY_CONTEXT' in input, false);
	});

	it('rejects an unknown command', () => {
		assert.throws(() => planMarketingBuild('start', siteEnv), /Usage/);
	});
});
