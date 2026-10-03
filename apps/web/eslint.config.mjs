import {defineConfig, globalIgnores} from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
	...nextVitals,
	...nextTs,
	{
		rules: {
			// React Compiler rules shipped with eslint-plugin-react-hooks 7; they never ran while
			// typescript-eslint refused TypeScript 7. Keep them off until a dedicated lint pass.
			'react-hooks/set-state-in-effect': 'off',
			'react-hooks/purity': 'off',
			'react-hooks/immutability': 'off',
			'react-hooks/preserve-manual-memoization': 'off',
		},
	},
	globalIgnores([
		'.next/**',
		'out/**',
		'build/**',
		'coverage/**',
		'e2e/**',
		'playwright-report/**',
		'test-results/**',
		'next-env.d.ts',
	]),
]);
