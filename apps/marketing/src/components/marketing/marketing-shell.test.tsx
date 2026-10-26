import {fireEvent, render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MarketingShell} from '@/components/marketing/marketing-shell';
import {resetWakePingForTests} from '@/lib/marketing/wake-ping';

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
		expect(screen.getAllByRole('link', {name: 'Sign in'})[0]).toHaveAttribute(
			'href',
			'http://localhost:3000/login',
		);

		const footer = screen.getByRole('navigation', {name: 'Footer'});
		const footerHome = footer.querySelector('a[href="/"]');
		expect(footerHome).toHaveAttribute('aria-current', 'page');
		expect(footerHome).toHaveClass('text-brand');
	});

	it('keeps the logo a link named MedConnect Pro that does not shrink', () => {
		render(
			<MarketingShell>
				<p>Placeholder</p>
			</MarketingShell>,
		);

		const logo = within(screen.getByRole('banner')).getByRole('link', {name: 'MedConnect Pro'});
		expect(logo).toHaveAttribute('href', '/');
		expect(logo).toHaveClass('shrink-0');
		expect(within(logo).getByText('MedConnect Pro')).toHaveClass(
			'whitespace-nowrap',
			'max-[359px]:sr-only',
		);
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
		const dialog = screen.getByRole('dialog', {name: 'MedConnect Pro'});
		expect(within(dialog).getByText('MC').parentElement).toHaveClass(
			'whitespace-nowrap',
			'text-base',
		);

		await user.click(screen.getByRole('button', {name: 'Close navigation'}));

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('wakes the API only on a trusted gesture on a sign-in link, never on render (FE-049)', () => {
		vi.stubEnv('NEXT_PUBLIC_API_ORIGIN', 'https://api.example.test');
		const fetchMock = vi.fn().mockResolvedValue({});
		vi.stubGlobal('fetch', fetchMock);
		resetWakePingForTests();
		window.localStorage.clear();

		render(
			<MarketingShell>
				<p>Placeholder</p>
			</MarketingShell>,
		);
		expect(fetchMock).not.toHaveBeenCalled();

		const signIn = screen.getAllByRole('link', {name: /sign in/i})[0];
		signIn.addEventListener('click', (event) => event.preventDefault());
		// jsdom dispatches untrusted events (isTrusted false), like a script would.
		fireEvent.pointerOver(signIn);
		fireEvent.focusIn(signIn);
		fireEvent.click(signIn);
		expect(fetchMock).not.toHaveBeenCalled();

		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});
});
