import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MarketingShell} from '@/components/marketing/marketing-shell';

const navigation = vi.hoisted(() => ({pathname: '/'}));

vi.mock('next/navigation', () => ({
	usePathname: () => navigation.pathname,
}));

describe('MarketingShell', () => {
	beforeEach(() => {
		navigation.pathname = '/';
	});

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

		const footer = screen.getByRole('navigation', {name: 'Footer'});
		const footerHome = footer.querySelector('a[href="/"]');
		expect(footerHome).toHaveAttribute('aria-current', 'page');
		expect(footerHome).toHaveClass('text-brand');
	});

	it('highlights Platform in the footer on nested platform routes', () => {
		navigation.pathname = '/platform/appointments';
		render(
			<MarketingShell>
				<p>Placeholder</p>
			</MarketingShell>,
		);

		const footer = screen.getByRole('navigation', {name: 'Footer'});
		const footerPlatform = footer.querySelector('a[href="/platform"]');
		expect(footerPlatform).toHaveAttribute('aria-current', 'page');
		expect(footerPlatform).toHaveClass('text-brand');
		expect(footer.querySelector('a[href="/"]')).not.toHaveAttribute('aria-current');
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
