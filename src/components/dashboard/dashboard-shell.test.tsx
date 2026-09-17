import {render, screen} from '@testing-library/react';
import {DashboardShell} from '@/components/dashboard/dashboard-shell';

jest.mock('next/navigation', () => ({
	usePathname: () => '/dashboard',
}));

jest.mock('@/lib/hooks/use-session', () => ({
	useCurrentSession: () => ({
		data: {
			userRole: 'PRACTICE_ADMIN',
		},
	}),
}));

jest.mock('@/lib/api/mocks/runtime', () => ({
	isMockMode: () => true,
}));

describe('DashboardShell', () => {
	it('exposes skip navigation, a labelled primary nav, and the current page', () => {
		render(
			<DashboardShell>
				<p>Overview</p>
			</DashboardShell>,
		);

		expect(screen.getByRole('link', {name: 'Skip to content'})).toHaveAttribute('href', '#main-content');
		expect(screen.getAllByRole('navigation', {name: 'Primary'}).length).toBeGreaterThan(0);
		expect(screen.getAllByRole('link', {name: 'Dashboard'})[0]).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
	});
});
