import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AppointmentList} from '@/components/appointments/appointment-list';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {DEFAULT_ROLE_PERMISSIONS} from '@/types/auth/permissions';
import {Appointment} from '@/types/medical/appointment';

const {useAppointments, useSessionStatus} = vi.hoisted(() => ({
	useAppointments: vi.fn(),
	useSessionStatus: vi.fn(),
}));

vi.mock('@/lib/hooks/use-medical', () => ({
	useAppointments,
}));

vi.mock('@/lib/hooks/use-session', () => ({
	useSessionStatus,
}));

vi.mock('@/lib/api/mocks/runtime', () => ({
	isMockMode: vi.fn(() => true),
}));

const sampleAppointment: Appointment = {
	id: 'demo-appointment-001',
	practiceId: 'demo-practice-001',
	patientId: 'demo-patient-001',
	providerId: 'demo-provider-001',
	start: '2026-10-15T14:00:00.000Z',
	end: '2026-10-15T15:00:00.000Z',
	type: 'office_visit',
	state: 'scheduled',
	patientName: 'Avery Carter',
	providerName: 'Dr. Jordan Ellis',
	synthetic: true,
};

function mockAppointments(overrides: Record<string, unknown> = {}) {
	useAppointments.mockReturnValue({
		data: [sampleAppointment],
		isPending: false,
		isError: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('AppointmentList', () => {
	beforeEach(() => {
		vi.mocked(isMockMode).mockReturnValue(true);
		useSessionStatus.mockReturnValue({
			session: {permissions: DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN},
			isLoading: false,
		});
	});

	it('renders appointment rows and a schedule link', () => {
		mockAppointments();
		render(<AppointmentList />);

		expect(screen.getByRole('list', {name: 'Appointments'})).toBeInTheDocument();
		expect(screen.getByText(/Avery Carter/)).toBeInTheDocument();
		expect(screen.getByText(/Office visit/)).toBeInTheDocument();
		expect(screen.getByRole('link', {name: 'Schedule appointment'})).toHaveAttribute(
			'href',
			'/dashboard/appointments/new',
		);
	});

	it('hides the schedule link without write:appointments', () => {
		useSessionStatus.mockReturnValue({
			session: {permissions: DEFAULT_ROLE_PERMISSIONS.NURSE},
			isLoading: false,
		});
		mockAppointments();
		render(<AppointmentList />);

		expect(screen.queryByRole('link', {name: 'Schedule appointment'})).not.toBeInTheDocument();
		expect(screen.getByText(/Avery Carter/)).toBeInTheDocument();
	});

	it('shows an error alert and retries', async () => {
		const refetch = vi.fn();
		mockAppointments({data: undefined, isError: true, refetch});
		const user = userEvent.setup();
		render(<AppointmentList />);

		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load appointments.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));
		expect(refetch).toHaveBeenCalledOnce();
	});

	it('renders appointment rows when mocks are off', () => {
		vi.mocked(isMockMode).mockReturnValue(false);
		mockAppointments();
		render(<AppointmentList />);

		expect(screen.getByRole('list', {name: 'Appointments'})).toBeInTheDocument();
		expect(screen.getByText(/Avery Carter/)).toBeInTheDocument();
		expect(screen.queryByText(/mock-only until the appointment API is available/)).not.toBeInTheDocument();
	});
});
