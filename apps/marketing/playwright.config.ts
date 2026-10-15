import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.spec.ts',
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
		baseURL: 'http://localhost:3002',
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
		command: 'npx next dev --turbopack --port 3002',
		url: 'http://localhost:3002',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: {
			...process.env,
			NEXT_PUBLIC_SITE_URL: 'http://localhost:3002',
			NEXT_PUBLIC_APP_ORIGIN: 'http://localhost:3000',
		},
	},
});
