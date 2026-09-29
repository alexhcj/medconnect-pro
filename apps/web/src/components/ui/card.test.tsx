import {render, screen} from '@testing-library/react';
import {Card, CardDescription, CardTitle} from '@/components/ui/card';

describe('Card', () => {
	it('uses surface, border, and foreground tokens', () => {
		const {container} = render(
			<Card>
				<CardTitle>Visit summary</CardTitle>
				<CardDescription>Synthetic demo data only.</CardDescription>
			</Card>,
		);

		expect(container.firstChild).toHaveClass('bg-surface', 'border-border', 'text-foreground');
		expect(screen.getByRole('heading', {name: 'Visit summary'})).toBeInTheDocument();
		expect(screen.getByText('Synthetic demo data only.')).toHaveClass('text-foreground-secondary');
	});
});
