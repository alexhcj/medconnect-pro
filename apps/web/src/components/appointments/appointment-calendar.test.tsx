import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AppointmentCalendar} from '@/components/appointments/appointment-calendar';
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

const cancelledAppointment: Appointment = {
	...sampleAppointment,
	id: 'demo-appointment-003',
	start: '2026-10-14T14:00:00.000Z',
	end: '2026-10-14T15:00:00.000Z',
	type: 'follow_up',
	state: 'cancelled',
};

function mockAppointments(overrides: Record<string, unknown> = {}) {
	useAppointments.mockReturnValue({
		data: [sampleAppointment, cancelledAppointment],
		isPending: false,
		isError: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('AppointmentCalendar', () => {
	beforeEach(() => {
		vi.mocked(isMockMode).mockReturnValue(true);
		useSessionStatus.mockReturnValue({
			session: {permissions: DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN},
			isLoading: false,
		});
	});

	it('renders week view controls and appointment events', () => {
		mockAppointments();
		render(<AppointmentCalendar />);

		expect(screen.getByRole('button', {name: 'Week view'})).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('region', {name: 'Appointment calendar'})).toBeInTheDocument();
		expect(screen.getByRole('button', {name: /Avery Carter · Dr\. Jordan Ellis · Scheduled/})).toBeInTheDocument();
		expect(screen.getByRole('button', {name: /Avery Carter · Dr\. Jordan Ellis · Cancelled/})).toBeInTheDocument();
		expect(screen.getByRole('link', {name: 'Schedule appointment'})).toHaveAttribute(
			'href',
			'/dashboard/appointments/new',
		);
	});

	it('switches month, week, and day views', async () => {
		mockAppointments();
		const user = userEvent.setup();
		render(<AppointmentCalendar />);

		await user.click(screen.getByRole('button', {name: 'Month view'}));
		expect(screen.getByRole('button', {name: 'Month view'})).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('button', {name: 'Week view'})).toHaveAttribute('aria-pressed', 'false');

		await user.click(screen.getByRole('button', {name: 'Day view'}));
		expect(screen.getByRole('button', {name: 'Day view'})).toHaveAttribute('aria-pressed', 'true');
	});

	it('opens appointment details and a patient profile link', async () => {
		mockAppointments();
		const user = userEvent.setup();
		render(<AppointmentCalendar />);

		await user.click(screen.getByRole('button', {name: /Avery Carter · Dr\. Jordan Ellis · Scheduled/}));
		const dialog = screen.getByRole('dialog', {name: 'Appointment'});
		expect(dialog).toHaveTextContent('Avery Carter');
		expect(dialog).toHaveTextContent('Dr. Jordan Ellis');
		expect(dialog).toHaveTextContent('Office visit');
		expect(dialog).toHaveTextContent('Scheduled');
		expect(screen.getByRole('link', {name: 'View patient profile'})).toHaveAttribute(
			'href',
			'/dashboard/patients/demo-patient-001',
		);

		await user.click(screen.getByRole('button', {name: 'Close'}));
		expect(screen.queryByRole('dialog', {name: 'Appointment'})).not.toBeInTheDocument();
	});

	it('hides the profile link without patient read grants', async () => {
		useSessionStatus.mockReturnValue({
			session: {permissions: DEFAULT_ROLE_PERMISSIONS.PATIENT},
			isLoading: false,
		});
		mockAppointments();
		const user = userEvent.setup();
		render(<AppointmentCalendar />);

		await user.click(screen.getByRole('button', {name: /Avery Carter · Dr\. Jordan Ellis · Scheduled/}));
		expect(screen.getByRole('dialog', {name: 'Appointment'})).toBeInTheDocument();
		expect(screen.queryByRole('link', {name: 'View patient profile'})).not.toBeInTheDocument();
		expect(screen.queryByRole('link', {name: 'Schedule appointment'})).not.toBeInTheDocument();
	});

	it('shows an error alert and retries', async () => {
		const refetch = vi.fn();
		mockAppointments({data: undefined, isError: true, refetch});
		const user = userEvent.setup();
		render(<AppointmentCalendar />);

		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load appointments.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));
		expect(refetch).toHaveBeenCalledOnce();
	});

	it('shows a loading state', () => {
		mockAppointments({data: undefined, isPending: true});
		render(<AppointmentCalendar />);

		expect(screen.getByText('Loading appointments')).toBeInTheDocument();
		expect(screen.queryByRole('region', {name: 'Appointment calendar'})).not.toBeInTheDocument();
	});

	it('shows an empty state when there are no events', () => {
		mockAppointments({data: []});
		render(<AppointmentCalendar />);

		expect(screen.getByText('No appointments scheduled.')).toBeInTheDocument();
		expect(screen.queryByRole('region', {name: 'Appointment calendar'})).not.toBeInTheDocument();
	});

	it('shows a mock-only status when mocks are off', () => {
		vi.mocked(isMockMode).mockReturnValue(false);
		mockAppointments();
		render(<AppointmentCalendar />);

		expect(screen.getByRole('status')).toHaveTextContent(
			'Appointment scheduling is mock-only until the appointment API is available.',
		);
		expect(screen.queryByRole('region', {name: 'Appointment calendar'})).not.toBeInTheDocument();
	});
});
