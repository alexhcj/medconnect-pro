import {render, screen} from '@testing-library/react';
import {VisitUnavailable} from '@/components/telehealth/visit-unavailable';

describe('VisitUnavailable', () => {
	it('shows terminal copy and a lobby link', () => {
		render(
			<VisitUnavailable
				title="This visit has ended"
				message="The consultation is closed. You cannot rejoin or mint live media for this session."
			/>,
		);

		expect(screen.getByRole('heading', {name: 'This visit has ended'})).toBeInTheDocument();
		expect(screen.getByRole('link', {name: 'Return to lobby'})).toHaveAttribute(
			'href',
			'/dashboard/telehealth',
		);
		expect(screen.queryByRole('button', {name: 'Join session'})).not.toBeInTheDocument();
	});
});
