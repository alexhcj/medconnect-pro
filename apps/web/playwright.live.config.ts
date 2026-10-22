/// <reference types="node" />
import {defineConfig, devices} from '@playwright/test';

/**
 * Non-mock browser checks for FE-011, FE-012, FE-013, FE-014, FE-015, FE-016, FE-024, FE-025, and FE-026.
 * Requires Postgres, migrations, `npm run seed:mock-identity`, and the API on port 3001.
 * The default `playwright.config.ts` suite stays on mocks and ignores these specs.
 *
 * Project order (QA-008): `auth` runs the real sign-in specs, `setup` signs in once per account and
 * saves the session, `app` reuses it, `teardown` signs out. The API allows 5 password sign-ins per
 * account per 15 minutes, so do not give every spec its own sign-in. Run procedure, including the
 * limiter and session reset: docs/workflows/frontend-testing.md.
 */
export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*-live.spec.ts',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: 1,
	timeout: 60_000,
	expect: {
		timeout: 10_000,
	},
	outputDir: 'test-results',
	reporter: [['list']],
	use: {
		baseURL: 'http://localhost:3000',
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'auth',
			testMatch: '**/auth{,-*}-live.spec.ts',
			use: {...devices['Desktop Chrome']},
		},
		{
			name: 'setup',
			testMatch: '**/live.setup.ts',
			teardown: 'teardown',
			dependencies: ['auth'],
			use: {...devices['Desktop Chrome']},
		},
		{
			name: 'teardown',
			testMatch: '**/live.teardown.ts',
			use: {...devices['Desktop Chrome']},
		},
		{
			name: 'app',
			testMatch: '**/*-live.spec.ts',
			testIgnore: '**/auth{,-*}-live.spec.ts',
			dependencies: ['setup'],
			use: {...devices['Desktop Chrome']},
		},
	],
	webServer: {
		command: 'npx next dev --turbopack',
		url: 'http://localhost:3000',
		reuseExistingServer: false,
		timeout: 120_000,
		env: {
			...process.env,
			NEXT_PUBLIC_USE_MOCKS: 'false',
			NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001',
			NEXT_PUBLIC_OAUTH_ENABLED: 'true',
		},
	},
});
