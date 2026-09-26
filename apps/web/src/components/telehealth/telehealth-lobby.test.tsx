import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {TelehealthLobby} from '@/components/telehealth/telehealth-lobby';
import {TelehealthSession} from '@/types/medical/telehealth-session';

const {useJoinableTelehealthVisits, useSessionStatus} = vi.hoisted(() => ({
	useJoinableTelehealthVisits: vi.fn(),
	useSessionStatus: vi.fn(),
}));

vi.mock('@/lib/hooks/use-telehealth', () => ({
	useJoinableTelehealthVisits,
}));

vi.mock('@/lib/hooks/use-session', () => ({
	useSessionStatus,
}));

const sampleVisit: TelehealthSession = {
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

function mockVisits(overrides: Record<string, unknown> = {}) {
	useJoinableTelehealthVisits.mockReturnValue({
		data: [sampleVisit],
		isPending: false,
		isError: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('TelehealthLobby', () => {
	beforeEach(() => {
		useSessionStatus.mockReturnValue({
			session: {userRole: 'PRACTICE_ADMIN'},
			isLoading: false,
		});
	});

	it('renders visit linkage and a join link', () => {
		mockVisits();
		render(<TelehealthLobby />);

		expect(screen.getByRole('heading', {level: 1, name: 'Telehealth'})).toBeInTheDocument();
		expect(screen.getByText('Synthetic demo. Not a production telehealth deployment.')).toBeInTheDocument();
		expect(screen.getByRole('list', {name: 'Telehealth visits'})).toHaveTextContent('Taylor Bennett');
		expect(screen.getByRole('list', {name: 'Telehealth visits'})).toHaveTextContent('Dr. Casey Walsh');
		expect(screen.getByRole('list', {name: 'Telehealth visits'})).toHaveTextContent('Telehealth');
		expect(screen.getByRole('link', {name: 'Join visit'})).toHaveAttribute(
			'href',
			'/dashboard/telehealth/session-demo-appointment-002',
		);
	});

	it('denies a receptionist session', () => {
		useSessionStatus.mockReturnValue({
			session: {userRole: 'RECEPTIONIST'},
			isLoading: false,
		});
		mockVisits();
		render(<TelehealthLobby />);

		expect(screen.getByRole('status')).toHaveTextContent('You do not have access to telehealth sessions.');
		expect(screen.queryByRole('link', {name: 'Join visit'})).not.toBeInTheDocument();
		expect(useJoinableTelehealthVisits).toHaveBeenCalledWith(false);
	});

	it('shows a loading state', () => {
		mockVisits({data: undefined, isPending: true});
		render(<TelehealthLobby />);

		expect(screen.getByText('Loading telehealth visits')).toBeInTheDocument();
		expect(screen.queryByRole('list', {name: 'Telehealth visits'})).not.toBeInTheDocument();
	});

	it('shows an error alert and retries', async () => {
		const refetch = vi.fn();
		mockVisits({data: undefined, isError: true, refetch});
		const user = userEvent.setup();
		render(<TelehealthLobby />);

		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load telehealth visits.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));
		expect(refetch).toHaveBeenCalledOnce();
	});

	it('shows an empty message', () => {
		mockVisits({data: []});
		render(<TelehealthLobby />);

		expect(screen.getByText('No telehealth visits are ready to join.')).toBeInTheDocument();
	});
});
