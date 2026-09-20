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
		exclude: ['e2e/**', 'node_modules/**', '.next/**'],
		env: {
			NODE_ENV: 'test',
			NEXT_PUBLIC_USE_MOCKS: 'true',
			NEXT_PUBLIC_MOCK_DELAY: '0',
			NEXT_PUBLIC_MOCK_ERROR_RATE: '0',
			NEXT_PUBLIC_MOCK_LOG_LEVEL: 'silent',
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(root, './src'),
			'@docs': path.resolve(root, './docs'),
		},
	},
});
