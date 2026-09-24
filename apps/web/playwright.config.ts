import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.spec.ts',
	testIgnore: '**/*-live.spec.ts',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	timeout: 60_000,
	expect: {
		timeout: 10_000,
	},
	outputDir: 'test-results',
	reporter: [['list'], ['html', {open: 'never', outputFolder: 'playwright-report'}]],
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
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: {
			...process.env,
			NEXT_PUBLIC_USE_MOCKS: 'true',
			NEXT_PUBLIC_MOCK_DELAY: '0',
			NEXT_PUBLIC_MOCK_ERROR_RATE: '0',
			NEXT_PUBLIC_MOCK_LOG_LEVEL: 'silent',
		},
	},
});
