import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./vitest.setup.ts'],
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		exclude: ['e2e/**', 'node_modules/**', '.next/**', 'out/**'],
		env: {
			NODE_ENV: 'test',
			NEXT_PUBLIC_SITE_URL: 'http://localhost:3002',
			NEXT_PUBLIC_APP_ORIGIN: 'http://localhost:3000',
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(root, './src'),
		},
	},
});
