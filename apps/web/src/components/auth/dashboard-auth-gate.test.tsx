import {render, screen} from '@testing-library/react';
import {DashboardAuthGate} from '@/components/auth/dashboard-auth-gate';
import {ApiError} from '@/lib/api/http';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
	useRouter: () => ({replace}),
}));

vi.mock('@/components/providers/session-provider', () => ({
	SessionProvider: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
}));

const sessionState = vi.hoisted(() => ({
	value: {
		data: undefined as {userRole?: string} | undefined,
		isPending: false,
		isError: false,
		error: undefined as Error | undefined,
	},
}));

vi.mock('@/lib/hooks/use-session', () => ({
	useCurrentSession: () => sessionState.value,
}));

describe('DashboardAuthGate', () => {
	beforeEach(() => {
		replace.mockReset();
		sessionState.value = {
			data: undefined,
			isPending: false,
			isError: false,
			error: undefined,
		};
	});

	it('redirects to login when the session is unauthorized', () => {
		sessionState.value = {
			data: undefined,
			isPending: false,
			isError: true,
			error: new ApiError('Unauthorized', 401),
		};

		render(
			<DashboardAuthGate>
				<p>Secret</p>
			</DashboardAuthGate>,
		);

		expect(screen.getByRole('status')).toHaveTextContent(/redirecting to login/i);
		expect(replace).toHaveBeenCalledWith('/login?reason=unauthorized');
		expect(screen.queryByText('Secret')).not.toBeInTheDocument();
	});

	it('renders children when a session exists', () => {
		sessionState.value = {
			data: {userRole: 'PRACTICE_ADMIN'},
			isPending: false,
			isError: false,
			error: undefined,
		};

		render(
			<DashboardAuthGate>
				<p>Secret</p>
			</DashboardAuthGate>,
		);

		expect(screen.getByText('Secret')).toBeInTheDocument();
		expect(replace).not.toHaveBeenCalled();
	});
});
