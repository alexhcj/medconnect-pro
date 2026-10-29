import {render, screen} from '@testing-library/react';
import {MarketingStatusCard} from '@/components/marketing/marketing-status-card';
import {
	MARKETING_STATUS_TONES,
	type MarketingStatusLabel,
} from '@/components/marketing/marketing-status-tones';

const TONE_CLASSES = {
	success: 'text-success-strong',
	accent: 'text-brand-hover',
	neutral: 'text-foreground-secondary',
	warning: 'text-warning',
} as const;

describe('MarketingStatusCard', () => {
	it.each(Object.entries(MARKETING_STATUS_TONES) as [MarketingStatusLabel, keyof typeof TONE_CLASSES][])(
		'renders "%s" as a static %s badge',
		(label, tone) => {
			render(<MarketingStatusCard title="Title" description="Description" detail="Detail" status={label} />);

			const badge = screen.getByText(label);
			expect(badge.tagName).toBe('SPAN');
			expect(badge).toHaveClass('rounded-md', TONE_CLASSES[tone]);
			expect(badge).not.toHaveAttribute('tabindex');
			expect(screen.queryByRole('link')).toBeNull();
		},
	);

	it('makes the whole card one link with the route and a hidden arrow', () => {
		const {container} = render(
			<MarketingStatusCard
				title="Appointments"
				description="Calendar views."
				detail="Implemented in the authenticated app."
				status={{label: '/platform/appointments', href: '/platform/appointments'}}
			/>,
		);

		const links = screen.getAllByRole('link');
		expect(links).toHaveLength(1);
		expect(links[0]).toHaveAttribute('href', '/platform/appointments');
		expect(links[0]).toHaveClass('group', 'focus-visible:ring-2');
		expect(links[0]).toHaveTextContent('Appointments');
		expect(links[0]).toHaveTextContent('/platform/appointments');
		expect(links[0].querySelector('a')).toBeNull();
		expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
	});
});
