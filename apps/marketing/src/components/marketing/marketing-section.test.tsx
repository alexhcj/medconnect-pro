import {marketingSectionGridClassName} from '@/components/marketing/marketing-section';

describe('marketingSectionGridClassName', () => {
	it('shows three items as one column, then three columns from md (no lone card at sm)', () => {
		const classes = marketingSectionGridClassName(3).split(' ');

		expect(classes).toContain('md:grid-cols-3');
		expect(classes).not.toContain('sm:grid-cols-2');
	});

	it('shows four items in 1, 2 (from sm) and 4 (from lg) columns', () => {
		const classes = marketingSectionGridClassName(4).split(' ');

		expect(classes).toEqual(expect.arrayContaining(['sm:grid-cols-2', 'lg:grid-cols-4']));
	});

	it('keeps five items at 2 columns from sm and 5 from lg', () => {
		const classes = marketingSectionGridClassName(5).split(' ');

		expect(classes).toEqual(expect.arrayContaining(['sm:grid-cols-2', 'lg:grid-cols-5']));
	});
});
