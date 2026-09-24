import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentsPage from '@/app/(dashboard)/dashboard/appointments/page';
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

describe('AppointmentsPage', () => {
	beforeEach(() => {
		vi.mocked(isMockMode).mockReturnValue(true);
		useSessionStatus.mockReturnValue({
			session: {permissions: DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN},
			isLoading: false,
		});
		useAppointments.mockReturnValue({
			data: [sampleAppointment],
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		});
	});

	it('defaults to the calendar and can switch to the list', async () => {
		const user = userEvent.setup();
		render(<AppointmentsPage />);

		expect(screen.getByRole('button', {name: 'Calendar'})).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('region', {name: 'Appointment calendar'})).toBeInTheDocument();
		expect(screen.queryByRole('list', {name: 'Appointments'})).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', {name: 'List'}));
		expect(screen.getByRole('button', {name: 'List'})).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('list', {name: 'Appointments'})).toBeInTheDocument();
		expect(screen.queryByRole('region', {name: 'Appointment calendar'})).not.toBeInTheDocument();
	});
});
