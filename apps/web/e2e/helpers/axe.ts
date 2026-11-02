import AxeBuilder from '@axe-core/playwright';
import {expect, type Page} from '@playwright/test';

/** WCAG 2.2 AA scan of the given regions; fails with `rule: selector` lines (FE-061). */
export async function expectNoAxeViolations(page: Page, regions: string[]) {
	const builder = new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']);
	for (const region of regions) builder.include(region);
	const results = await builder.analyze();
	expect(
		results.violations.map(
			(violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
		),
	).toEqual([]);
}
