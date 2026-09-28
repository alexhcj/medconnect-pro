import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MarketingShell} from '@/components/marketing/marketing-shell';

vi.mock('next/navigation', () => ({
	usePathname: () => '/',
}));

describe('MarketingShell', () => {
	it('renders skip navigation, header, labelled primary nav, main, and footer', () => {
		render(
			<MarketingShell>
				<p>Placeholder</p>
			</MarketingShell>,
		);

		expect(screen.getByRole('link', {name: 'Skip to content'})).toHaveAttribute(
			'href',
			'#main-content',
		);
		expect(screen.getByRole('banner')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Open navigation'})).toHaveAttribute(
			'aria-controls',
			'marketing-mobile-navigation',
		);
		expect(screen.getByRole('button', {name: 'Open navigation'})).toHaveAttribute(
			'aria-expanded',
			'false',
		);
		expect(screen.getAllByRole('navigation', {name: 'Primary'}).length).toBeGreaterThan(0);
		expect(screen.getAllByRole('link', {name: 'Home'})[0]).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
		expect(screen.getByRole('contentinfo')).toBeInTheDocument();
		expect(screen.getByText('Placeholder')).toBeInTheDocument();
		expect(screen.getAllByRole('link', {name: 'Sign in'})[0]).toHaveAttribute('href', '/login');
	});

	it('opens and closes mobile navigation from the header control', async () => {
		const user = userEvent.setup();

		render(
			<MarketingShell>
				<p>Placeholder</p>
			</MarketingShell>,
		);

		await user.click(screen.getByRole('button', {name: 'Open navigation'}));

		expect(await screen.findByRole('dialog')).toBeInTheDocument();
		expect(document.getElementById('marketing-mobile-navigation')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Close navigation'})).toBeInTheDocument();
		expect(screen.getAllByRole('navigation', {name: 'Primary'}).length).toBeGreaterThan(0);

		await user.click(screen.getByRole('button', {name: 'Close navigation'}));

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});
