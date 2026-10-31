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
	{
		files: ['src/**/*.{ts,tsx}'],
		ignores: ['src/**/*.test.{ts,tsx}'],
		rules: {
			// FE-057: dates and times follow one fixed en-US format, never the browser language.
			'no-restricted-syntax': [
				'error',
				{
					selector: "CallExpression[callee.property.name=/^toLocale(Date|Time)?String$/]",
					message: 'Use the shared formatters in @/lib/format/date (fixed en-US) instead of toLocale*String.',
				},
				// FE-058: select lists use the design-system listbox, never the browser's native picker.
				{
					selector: "JSXOpeningElement[name.name='select']",
					message: 'Use SelectField from @/components/ui/select-field instead of a native <select>.',
				},
			],
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
