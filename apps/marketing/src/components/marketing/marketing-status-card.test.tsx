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

	it('keeps the Badge static and adds one inline link beside it', () => {
		render(
			<MarketingStatusCard
				title="Tenant isolation"
				description="Description"
				detail="Detail"
				status="Implemented pattern"
				link={{label: "Where it's enforced", href: '/architecture#database'}}
			/>,
		);

		const links = screen.getAllByRole('link');
		expect(links).toHaveLength(1);
		expect(links[0]).toHaveAttribute('href', '/architecture#database');
		expect(links[0]).toHaveAccessibleName("Where it's enforced: Tenant isolation");
		expect(links[0]).toHaveClass('min-h-11', 'focus-visible:ring-2');
		expect(links[0]).not.toHaveTextContent('Implemented pattern');
		expect(screen.getByText('Implemented pattern').tagName).toBe('SPAN');
	});

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
