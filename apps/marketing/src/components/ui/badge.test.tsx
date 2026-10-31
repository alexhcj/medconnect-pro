import {render, screen} from '@testing-library/react';
import {Badge, type BadgeTone} from '@/components/ui/badge';

describe('Badge', () => {
	it.each<[BadgeTone, string[]]>([
		['success', ['bg-subtle', 'text-success-strong']],
		['accent', ['bg-brand-subtle', 'text-brand-hover']],
		['neutral', ['bg-subtle', 'text-foreground-secondary']],
		['warning', ['bg-warning-subtle', 'text-warning']],
	])('renders the %s tone', (tone, classes) => {
		render(<Badge tone={tone}>Label</Badge>);

		expect(screen.getByText('Label')).toHaveClass('rounded-md', 'text-xs', ...classes);
	});

	it('defaults to the neutral tone', () => {
		render(<Badge>Planned</Badge>);

		expect(screen.getByText('Planned')).toHaveClass('bg-subtle', 'text-foreground-secondary');
	});

	it('is a non-interactive span with no link, button or hover styling', () => {
		render(<Badge tone="success">Shipped</Badge>);

		const badge = screen.getByText('Shipped');
		expect(badge.tagName).toBe('SPAN');
		expect(screen.queryByRole('link')).toBeNull();
		expect(screen.queryByRole('button')).toBeNull();
		expect(badge).not.toHaveAttribute('tabindex');
		expect(badge.className).not.toMatch(/hover:|focus/);
	});

	it('hides the optional dot from assistive technology', () => {
		const {container} = render(<Badge dot>In progress</Badge>);

		const dot = container.querySelector('[aria-hidden="true"]');
		expect(dot).toHaveClass('rounded-full', 'bg-current');
	});
});
