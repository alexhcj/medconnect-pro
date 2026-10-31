/// <reference types="node" />
import {defineConfig, devices} from '@playwright/test';

/**
 * Marketing and README screenshot capture (QA-012). Run with `npm run screenshots:marketing`.
 * Serves a production mock build (`build:mocks` + `start:mocks`) so neither the TanStack Query
 * devtools nor the Next.js dev indicator is rendered. The build takes a few minutes, so this is
 * for occasional use, not CI. The default `playwright.config.ts` ignores `e2e/capture/`.
 * Stop any `next dev` server first: the production build overwrites `.next`.
 */
const PORT = 3100;

export default defineConfig({
	testDir: 'e2e/capture',
	testMatch: '**/*.spec.ts',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: 1,
	timeout: 120_000,
	expect: {
		timeout: 10_000,
	},
	outputDir: 'test-results/capture',
	reporter: [['list']],
	use: {
		baseURL: `http://localhost:${PORT}`,
		viewport: {width: 1440, height: 900},
		deviceScaleFactor: 1,
		colorScheme: 'light',
		reducedMotion: 'reduce',
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				viewport: {width: 1440, height: 900},
				deviceScaleFactor: 1,
			},
		},
	],
	webServer: {
		command: `npm run build:mocks && npm run start:mocks -- --port ${PORT}`,
		url: `http://localhost:${PORT}`,
		reuseExistingServer: false,
		timeout: 600_000,
		env: {
			...process.env,
			NEXT_PUBLIC_USE_MOCKS: 'true',
			NEXT_PUBLIC_MOCK_DELAY: '0',
			NEXT_PUBLIC_MOCK_ERROR_RATE: '0',
			NEXT_PUBLIC_MOCK_LOG_LEVEL: 'silent',
			NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS: 'true',
			NEXT_PUBLIC_MARKETING_URL: 'http://localhost:3002',
		},
	},
});
