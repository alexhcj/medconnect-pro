import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {TelehealthSessionShell} from '@/components/telehealth/telehealth-session-shell';
import {ApiError, RateLimitedError} from '@/lib/api/http';
import {TelehealthSession} from '@/types/medical/telehealth-session';

const {useTelehealthSession, useJoinTelehealthSession, useEndTelehealthSession, useSessionStatus, useAppointments, push} =
	vi.hoisted(() => ({
		useAppointments: vi.fn(),
		useTelehealthSession: vi.fn(),
		useJoinTelehealthSession: vi.fn(),
		useEndTelehealthSession: vi.fn(),
		useSessionStatus: vi.fn(),
		push: vi.fn(),
	}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({push}),
	useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/hooks/use-telehealth', () => ({
	useTelehealthSession,
	useJoinTelehealthSession,
	useEndTelehealthSession,
}));

vi.mock('@/lib/hooks/use-medical', () => ({
	useAppointments,
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
	participants: [],
	viewerCanEnd: false,
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
		useAppointments.mockReturnValue({
			data: [{id: 'demo-appointment-002', notes: 'Blood pressure follow-up'}],
		});
		// A successful join calls onSuccess, like the TanStack mutation (FE-067: the stage needs it).
		useJoinTelehealthSession.mockReturnValue({
			mutate: vi.fn((_id: string, options?: {onSuccess?: () => void}) => options?.onSuccess?.()),
			isPending: false,
			isError: false,
		});
		useEndTelehealthSession.mockReturnValue({mutate: vi.fn(), isPending: false, isError: false});
	});

	/** FE-067: a live visit opens on the green room; join from it to reach the stage. */
	async function enterLiveVisit(user: ReturnType<typeof userEvent.setup>) {
		await user.click(screen.getByRole('button', {name: 'Join visit'}));
	}

	it('shows the green room and appointment linkage', () => {
		mockVisit();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		expect(screen.getByRole('heading', {level: 1, name: 'Telehealth session'})).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: 'Video visit — Blood pressure follow-up'}),
		).toBeInTheDocument();
		expect(screen.getAllByText(/Taylor Bennett/).length).toBeGreaterThan(0);
		expect(screen.getByText('Taylor Bennett')).toBeInTheDocument();
		expect(screen.getByText('Dr. Casey Walsh')).toBeInTheDocument();
		expect(screen.getByText('demo-appointment-002')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Join visit'})).toBeInTheDocument();
		expect(screen.queryByRole('button', {name: 'Check camera and microphone'})).not.toBeInTheDocument();
	});

	it('joins from the green room', async () => {
		const mutate = vi.fn();
		useJoinTelehealthSession.mockReturnValue({mutate, isPending: false, isError: false});
		mockVisit();
		const user = userEvent.setup();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		await user.click(screen.getByRole('button', {name: 'Join visit'}));
		await waitFor(() => expect(mutate).toHaveBeenCalledWith('session-demo-appointment-002', expect.anything()));
	});

	it('shows a later joiner the green room first and the stage only after Join (FE-067)', async () => {
		mockVisit({data: {...waitingSession, state: 'in_session', joinedAt: '2026-10-16T16:00:00.000Z'}});
		const user = userEvent.setup();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		expect(screen.getByText('Pre-join check')).toBeInTheDocument();
		expect(screen.getByText('This visit has already started')).toBeInTheDocument();
		expect(screen.queryByRole('button', {name: 'Leave call'})).not.toBeInTheDocument();

		await enterLiveVisit(user);
		expect(await screen.findByRole('button', {name: 'Leave call'})).toBeInTheDocument();
		expect(screen.queryByText('Pre-join check')).not.toBeInTheDocument();
	});

	it('keeps the stage hidden when joining a live visit fails (FE-067)', async () => {
		useJoinTelehealthSession.mockReturnValue({mutate: vi.fn(), isPending: false, isError: false});
		mockVisit({data: {...waitingSession, state: 'in_session'}});
		const user = userEvent.setup();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		await enterLiveVisit(user);
		expect(screen.getByText('Pre-join check')).toBeInTheDocument();
		expect(screen.queryByRole('button', {name: 'Leave call'})).not.toBeInTheDocument();
	});

	it('does not show the already-started line to the first joiner', () => {
		mockVisit();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		expect(screen.queryByText('This visit has already started')).not.toBeInTheDocument();
	});

	it('does not import Daily media into mock in-session chrome', async () => {
		mockVisit({data: {...waitingSession, state: 'in_session'}});
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);
		await enterLiveVisit(userEvent.setup());

		expect(await screen.findByText('Demo placeholder. Not a live video connection.')).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('Demo placeholder');
		expect(
			screen.queryByText('Live media is not configured in this environment'),
		).not.toBeInTheDocument();
	});

	it('leaves the mock call without ending the Nest visit', async () => {
		const mutate = vi.fn();
		useEndTelehealthSession.mockReturnValue({mutate, isPending: false, isError: false});
		mockVisit({data: {...waitingSession, state: 'in_session'}});
		const user = userEvent.setup();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);
		await enterLiveVisit(user);

		expect(await screen.findByText('Demo placeholder. Not a live video connection.')).toBeInTheDocument();
		await user.click(screen.getByRole('button', {name: 'Leave call'}));
		expect(mutate).not.toHaveBeenCalled();
		expect(screen.getByText('You left the call. The visit is still open.')).toBeInTheDocument();
		expect(push).not.toHaveBeenCalled();
		await user.click(screen.getByRole('button', {name: 'Rejoin call'}));
		expect(screen.getByText('Demo placeholder. Not a live video connection.')).toBeInTheDocument();
	});

	it('shows media placeholders and ends an in-session visit', async () => {
		const mutate = vi.fn();
		useEndTelehealthSession.mockReturnValue({mutate, isPending: false, isError: false});
		mockVisit({data: {...waitingSession, state: 'in_session', viewerCanEnd: true}});
		const user = userEvent.setup();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);
		await enterLiveVisit(user);

		expect(await screen.findByRole('button', {name: 'Camera'})).toHaveAttribute('aria-pressed', 'false');
		await user.click(screen.getByRole('button', {name: 'Camera'}));
		expect(screen.getByRole('button', {name: 'Camera'})).toHaveAttribute('aria-pressed', 'true');
		await user.click(screen.getByRole('button', {name: 'Microphone'}));
		expect(screen.getByRole('button', {name: 'Microphone'})).toHaveAttribute('aria-pressed', 'true');
		await user.click(screen.getByRole('button', {name: 'Share screen'}));
		expect(screen.getByRole('button', {name: 'Share screen'})).toHaveAttribute('aria-pressed', 'true');

		await user.click(screen.getByRole('button', {name: 'End visit'}));
		expect(mutate).not.toHaveBeenCalled();
		const dialog = await screen.findByRole('dialog', {name: 'End this visit for everyone?'});
		await user.click(within(dialog).getByRole('button', {name: 'End visit'}));
		expect(mutate).toHaveBeenCalledWith('session-demo-appointment-002');
		// The page stays and shows the wrap-up once the session reads `ended`; no redirect to the lobby.
		expect(push).not.toHaveBeenCalled();
	});

	const liveEnded: TelehealthSession = {
		...waitingSession,
		state: 'ended',
		joinedAt: '2026-10-16T16:00:00.000Z',
		endedAt: '2026-10-16T16:18:00.000Z',
	};

	it('shows the provider wrap-up with a prefilled follow-up link after a live visit', () => {
		useAppointments.mockReturnValue({
			data: [{id: 'demo-appointment-002', notes: 'Blood pressure follow-up', patientId: 'patient-9', providerId: 'provider-3'}],
		});
		mockVisit({data: {...liveEnded, viewerCanEnd: true}});
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		expect(screen.getByRole('heading', {name: 'Visit wrap-up · Taylor Bennett'})).toBeInTheDocument();
		expect(screen.getByText('18 min')).toBeInTheDocument();
		expect(screen.getByRole('link', {name: 'Book follow-up'})).toHaveAttribute(
			'href',
			'/dashboard/appointments/new?patientId=patient-9&providerId=provider-3',
		);
		expect(screen.queryByRole('heading', {name: 'This visit has ended'})).not.toBeInTheDocument();
	});

	it('shows the patient confirmation, with a follow-up card only for a real next appointment', () => {
		useSessionStatus.mockReturnValue({session: {userRole: 'PATIENT'}, isLoading: false});
		useAppointments.mockReturnValue({
			data: [
				{id: 'demo-appointment-002', notes: 'Blood pressure follow-up', state: 'completed', start: '2026-10-16T16:00:00.000Z'},
			],
		});
		mockVisit({data: liveEnded});
		const view = render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		expect(screen.getByRole('heading', {name: 'Your visit has ended'})).toBeInTheDocument();
		expect(screen.queryByText('Follow-up appointment')).not.toBeInTheDocument();
		expect(screen.getByRole('link', {name: 'Back to appointments'})).toBeInTheDocument();
		view.unmount();

		useAppointments.mockReturnValue({
			data: [
				{id: 'demo-appointment-002', notes: 'x', state: 'completed', start: '2026-10-16T16:00:00.000Z'},
				{id: 'later', state: 'scheduled', start: '2099-01-01T15:00:00.000Z', providerName: 'Dr. Casey Walsh'},
			],
		});
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);
		expect(screen.getByRole('heading', {name: 'Follow-up appointment'})).toBeInTheDocument();
	});

	it('hides End visit when the server says the viewer cannot end, whatever the role', async () => {
		useSessionStatus.mockReturnValue({
			session: {userRole: 'PRACTICE_ADMIN'},
			isLoading: false,
		});
		mockVisit({data: {...waitingSession, state: 'in_session', viewerCanEnd: false}});
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);
		await enterLiveVisit(userEvent.setup());

		expect(await screen.findByRole('button', {name: 'Leave call'})).toBeInTheDocument();
		expect(screen.queryByRole('button', {name: 'End visit'})).not.toBeInTheDocument();
	});

	it('shows a terminal ended state instead of the waiting room', () => {
		mockVisit({data: {...waitingSession, state: 'ended'}});
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		expect(screen.getByRole('heading', {level: 2, name: 'This visit has ended'})).toBeInTheDocument();
		expect(screen.queryByRole('heading', {name: 'Waiting room'})).not.toBeInTheDocument();
		expect(screen.queryByRole('button', {name: 'Join visit'})).not.toBeInTheDocument();
		expect(screen.getByRole('link', {name: 'Return to lobby'})).toBeInTheDocument();
	});

	it('denies a receptionist session', () => {
		useSessionStatus.mockReturnValue({
			session: {userRole: 'RECEPTIONIST'},
			isLoading: false,
		});
		mockVisit();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		expect(screen.getByRole('status')).toHaveTextContent('You do not have access to telehealth sessions.');
		expect(screen.queryByRole('button', {name: 'Join visit'})).not.toBeInTheDocument();
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

	it('shows a terminal ineligible state when join is rejected', () => {
		useJoinTelehealthSession.mockReturnValue({
			mutate: vi.fn(),
			isPending: false,
			isError: true,
			error: new ApiError('This telehealth session cannot be joined.', 409, {code: 'SESSION_NOT_JOINABLE'}),
		});
		mockVisit();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		expect(screen.getByRole('heading', {level: 2, name: 'This visit is not available'})).toBeInTheDocument();
		expect(screen.getByText('This telehealth session cannot be joined.')).toBeInTheDocument();
		expect(screen.queryByRole('button', {name: 'Join visit'})).not.toBeInTheDocument();
	});

	it('keeps the green room and announces a 429', () => {
		useJoinTelehealthSession.mockReturnValue({
			mutate: vi.fn(),
			isPending: false,
			isError: true,
			error: new RateLimitedError(30),
		});
		mockVisit();
		render(<TelehealthSessionShell sessionId="session-demo-appointment-002" />);

		expect(
			screen.getByRole('heading', {level: 2, name: 'Video visit — Blood pressure follow-up'}),
		).toBeInTheDocument();
		expect(screen.getByRole('alert')).toHaveTextContent('Too many attempts. Try again in 30 seconds.');
		expect(screen.getByRole('button', {name: 'Join visit'})).toBeInTheDocument();
	});
});
