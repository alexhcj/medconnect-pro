/// <reference types="node" />
import {defineConfig, devices} from '@playwright/test';

/**
 * Non-mock browser checks for FE-011, FE-012, and FE-013.
 * Requires Postgres, migrations, `npm run seed:mock-identity`, and the API on port 3001.
 * The default `playwright.config.ts` suite stays on mocks and ignores these specs.
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
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
			},
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
		},
	},
});
