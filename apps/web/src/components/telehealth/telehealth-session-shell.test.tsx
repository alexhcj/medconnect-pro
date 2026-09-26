import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {TelehealthSessionShell} from '@/components/telehealth/telehealth-session-shell';
import {TelehealthSession} from '@/types/medical/telehealth-session';

const {useTelehealthSession, useJoinTelehealthSession, useLeaveTelehealthSession, useSessionStatus, push} =
	vi.hoisted(() => ({
		useTelehealthSession: vi.fn(),
		useJoinTelehealthSession: vi.fn(),
		useLeaveTelehealthSession: vi.fn(),
		useSessionStatus: vi.fn(),
		push: vi.fn(),
	}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({push}),
}));

vi.mock('@/lib/hooks/use-telehealth', () => ({
	useTelehealthSession,
	useJoinTelehealthSession,
	useLeaveTelehealthSession,
}));

vi.mock('@/lib/hooks/use-session', () => ({
	useSessionStatus,
}));

const waitingSession: TelehealthSession = {
	id: 'session-demo-appointment-002',
	appointmentId: 'demo-appointment-002',
	patientName: 'Taylor Bennett',
	providerName: 'Dr. Casey Walsh',
	start: '2026-10-16T16:00:00.000Z',
	end: '2026-10-16T16:30:00.000Z',
	type: 'telehealth',
	state: 'waiting',
	synthetic: true,
};

function mockVisit(overrides: Record<string, unknown> = {}) {
	useTelehealthSession.mockReturnValue({
		data: waitingSession,
		isPending: false,
		isError: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('TelehealthSessionShell', () => {
	beforeEach(() => {
		push.mockReset();
		useSessionStatus.mockReturnValue({
			session: {userRole: 'PRACTICE_ADMIN'},
			isLoading: false,
		});
		useJoinTelehealthSession.mockReturnValue({mutate: vi.fn(), isPending: false, isError: false});
		useLeaveTelehealthSession.mockReturnValue({mutate: vi.fn(), isPending: false, isError: false});
	});

	it('shows the waiting room and appointment linkage', () => {
		mockVisit();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		expect(screen.getByRole('heading', {level: 1, name: 'Telehealth session'})).toBeInTheDocument();
		expect(screen.getByRole('heading', {level: 2, name: 'Waiting room'})).toBeInTheDocument();
		expect(screen.getByText('Taylor Bennett')).toBeInTheDocument();
		expect(screen.getByText('Dr. Casey Walsh')).toBeInTheDocument();
		expect(screen.getByText('demo-appointment-002')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Join session'})).toBeInTheDocument();
		expect(screen.queryByRole('button', {name: 'Camera'})).not.toBeInTheDocument();
	});

	it('joins from the waiting room', async () => {
		const mutate = vi.fn();
		useJoinTelehealthSession.mockReturnValue({mutate, isPending: false, isError: false});
		mockVisit();
		const user = userEvent.setup();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		await user.click(screen.getByRole('button', {name: 'Join session'}));
		expect(mutate).toHaveBeenCalledWith('session-demo-appointment-002');
	});

	it('shows media placeholders and leaves an in-session visit', async () => {
		const mutate = vi.fn();
		useLeaveTelehealthSession.mockReturnValue({mutate, isPending: false, isError: false});
		mockVisit({data: {...waitingSession, state: 'in_session'}});
		const user = userEvent.setup();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		expect(screen.getByText('Demo placeholder. Not a live video connection.')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Camera'})).toHaveAttribute('aria-pressed', 'false');
		await user.click(screen.getByRole('button', {name: 'Camera'}));
		expect(screen.getByRole('button', {name: 'Camera'})).toHaveAttribute('aria-pressed', 'true');
		await user.click(screen.getByRole('button', {name: 'Microphone'}));
		expect(screen.getByRole('button', {name: 'Microphone'})).toHaveAttribute('aria-pressed', 'true');
		await user.click(screen.getByRole('button', {name: 'Screen share'}));
		expect(screen.getByRole('button', {name: 'Screen share'})).toHaveAttribute('aria-pressed', 'true');

		await user.click(screen.getByRole('button', {name: 'Leave session'}));
		expect(mutate).toHaveBeenCalledWith(
			'session-demo-appointment-002',
			expect.objectContaining({onSuccess: expect.any(Function)}),
		);
		mutate.mock.calls[0]?.[1]?.onSuccess();
		expect(push).toHaveBeenCalledWith('/dashboard/telehealth');
	});

	it('denies a receptionist session', () => {
		useSessionStatus.mockReturnValue({
			session: {userRole: 'RECEPTIONIST'},
			isLoading: false,
		});
		mockVisit();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		expect(screen.getByRole('status')).toHaveTextContent('You do not have access to telehealth sessions.');
		expect(screen.queryByRole('button', {name: 'Join session'})).not.toBeInTheDocument();
		expect(useTelehealthSession).toHaveBeenCalledWith('session-demo-appointment-002', false);
	});

	it('shows an error alert and retries', async () => {
		const refetch = vi.fn();
		mockVisit({data: undefined, isError: true, refetch});
		const user = userEvent.setup();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load this telehealth session.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));
		expect(refetch).toHaveBeenCalledOnce();
	});
});
