import {describe, expect, it} from 'vitest';

// INFRA-020 probe: passes on pull requests so the PR can merge, then fails on the push to main so
// Render's checksPass gate can be observed. Reverted right after the observation.
describe('INFRA-020 checksPass probe', () => {
	it('is red only on the push-to-main ci run', () => {
		const onMainPush =
			process.env.GITHUB_EVENT_NAME === 'push' && process.env.GITHUB_REF === 'refs/heads/main';
		expect(onMainPush).toBe(false);
	});
});
