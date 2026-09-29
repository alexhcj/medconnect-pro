import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const tokensCss = readFileSync(
	resolve(dirname(fileURLToPath(import.meta.url)), './tokens.css'),
	'utf8',
);

describe('design tokens', () => {
	it('maps Figma semantic colors to the existing Tailwind palette hex values', () => {
		expect(tokensCss).toContain('--color-bg-brand: #2563eb');
		expect(tokensCss).toContain('--color-bg-brand-hover: #1d4ed8');
		expect(tokensCss).toContain('--color-bg-surface: #ffffff');
		expect(tokensCss).toContain('--color-bg-canvas: #f9fafb');
		expect(tokensCss).toContain('--color-text-primary: #111827');
		expect(tokensCss).toContain('--color-text-inverse: #ffffff');
		expect(tokensCss).toContain('--color-border-default: #e5e7eb');
		expect(tokensCss).toContain('--color-border-input: #d1d5db');
		expect(tokensCss).toContain('--color-focus-brand: #3b82f6');
		expect(tokensCss).toContain('--color-bg-destructive: #dc2626');
		expect(tokensCss).toContain('--color-text-danger: #dc2626');
	});

	it('maps radius, type, and space to the Figma 4px grid', () => {
		expect(tokensCss).toContain('--radius-md: 6px');
		expect(tokensCss).toContain('--radius-lg: 8px');
		expect(tokensCss).toContain('--space-4: 16px');
		expect(tokensCss).toContain('--control-height-sm: 36px');
		expect(tokensCss).toContain('--control-height-md: 40px');
		expect(tokensCss).toContain('--control-height-lg: 44px');
		expect(tokensCss).toContain('--font-sans: var(--font-inter)');
		expect(tokensCss).toContain('--color-primary-600: #2563eb');
	});
});
