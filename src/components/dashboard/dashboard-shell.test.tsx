import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DashboardShell} from '@/components/dashboard/dashboard-shell';

vi.mock('next/navigation', () => ({
	usePathname: () => '/dashboard',
}));

vi.mock('@/lib/hooks/use-session', () => ({
	useCurrentSession: () => ({
		data: {
			userRole: 'PRACTICE_ADMIN',
		},
	}),
}));

vi.mock('@/lib/api/mocks/runtime', () => ({
	isMockMode: () => true,
}));

describe('DashboardShell', () => {
	it('renders skip navigation, header, labelled primary nav, and main content', () => {
		render(
			<DashboardShell>
				<p>Overview</p>
			</DashboardShell>,
		);

		expect(screen.getByRole('link', {name: 'Skip to content'})).toHaveAttribute('href', '#main-content');
		expect(screen.getByRole('button', {name: 'Open navigation'})).toHaveAttribute(
			'aria-controls',
			'mobile-navigation',
		);
		expect(screen.getByRole('button', {name: 'Notifications'})).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Account'})).toBeInTheDocument();
		expect(screen.getAllByRole('navigation', {name: 'Primary'}).length).toBeGreaterThan(0);
		expect(screen.getAllByRole('link', {name: 'Dashboard'})[0]).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
		expect(screen.getByText('Overview')).toBeInTheDocument();
	});

	it('opens mobile navigation from the header control', async () => {
		const user = userEvent.setup();

		render(
			<DashboardShell>
				<p>Overview</p>
			</DashboardShell>,
		);

		await user.click(screen.getByRole('button', {name: 'Open navigation'}));

		expect(await screen.findByRole('dialog')).toBeInTheDocument();
		expect(document.getElementById('mobile-navigation')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Close navigation'})).toBeInTheDocument();
		expect(screen.getAllByRole('navigation', {name: 'Primary'}).length).toBeGreaterThan(0);
	});
});
