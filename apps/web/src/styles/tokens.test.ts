import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const tokensCss = readFileSync(
	resolve(dirname(fileURLToPath(import.meta.url)), './tokens.css'),
	'utf8',
);

const token = (name: string) => {
	const match = tokensCss.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
	expect(match, `--${name} is defined`).not.toBeNull();
	return match![1];
};

const luminance = (hex: string) => {
	const [r, g, b] = [1, 3, 5]
		.map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
		.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
};

describe('design tokens', () => {
	it('maps Figma semantic colors to the existing Tailwind palette hex values', () => {
		expect(tokensCss).toContain('--color-bg-brand: #2563eb');
		expect(tokensCss).toContain('--color-bg-brand-hover: #1d4ed8');
		expect(tokensCss).toContain('--color-bg-surface: #ffffff');
		expect(tokensCss).toContain('--color-bg-canvas: #f9fafb');
		expect(tokensCss).toContain('--color-text-primary: #111827');
		expect(tokensCss).toContain('--color-text-inverse: #ffffff');
		expect(tokensCss).toContain('--color-border-default: #e5e7eb');
		expect(tokensCss).toContain('--color-border-input: #808896');
		expect(tokensCss).toContain('--color-border-input-hover: #6b7280');
		expect(tokensCss).toContain('--color-input-hover: var(--color-border-input-hover)');
		expect(tokensCss).toContain('--color-focus-brand: #3b82f6');
		expect(tokensCss).toContain('--color-bg-destructive: #dc2626');
		expect(tokensCss).toContain('--color-text-danger: #dc2626');
	});

	it('keeps control borders at 3:1 or better on the surface and the canvas (WCAG 1.4.11)', () => {
		const backgrounds = [token('color-bg-surface'), token('color-bg-canvas')];

		for (const name of ['color-border-input', 'color-border-input-hover']) {
			for (const background of backgrounds) {
				expect(contrast(token(name), background), `${name} on ${background}`).toBeGreaterThanOrEqual(3);
			}
		}
	});

	it('steps hover darker than the default and keeps card dividers out of the control token', () => {
		const surface = token('color-bg-surface');

		expect(contrast(token('color-border-input-hover'), surface)).toBeGreaterThan(
			contrast(token('color-border-input'), surface),
		);
		expect(token('color-border-default')).not.toBe(token('color-border-input'));
		expect(token('color-border-strong')).toBe('#d1d5db');
	});

	it('keeps the error and focus colours distinct from the default control border', () => {
		expect(token('color-border-danger')).not.toBe(token('color-border-input'));
		expect(token('color-focus-brand')).not.toBe(token('color-border-input'));
	});

	it('maps the Figma color/stage/* variables and keeps stage text and outlines readable (FE-063)', () => {
		expect(token('color-stage-bg')).toBe('#111827');
		expect(token('color-stage-surface')).toBe('#1f2937');
		expect(token('color-stage-surface-raised')).toBe('#374151');
		expect(token('color-stage-border')).toBe('#374151');
		expect(token('color-stage-border-strong')).toBe('#6b7280');
		expect(token('color-stage-text')).toBe('#ffffff');
		expect(token('color-stage-text-muted')).toBe('#d1d5db');

		const grounds = [token('color-stage-bg'), token('color-stage-surface')];
		for (const ground of grounds) {
			expect(contrast(token('color-stage-text'), ground)).toBeGreaterThanOrEqual(4.5);
			expect(contrast(token('color-stage-text-muted'), ground)).toBeGreaterThanOrEqual(4.5);
			expect(contrast(token('color-stage-border-strong'), ground)).toBeGreaterThanOrEqual(3);
		}
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
