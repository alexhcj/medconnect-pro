import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AppointmentEventDialog} from '@/components/appointments/appointment-event-dialog';
import {DEFAULT_ROLE_PERMISSIONS} from '@/types/auth/permissions';
import {Appointment} from '@/types/medical/appointment';

const appointment: Appointment = {
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

describe('AppointmentEventDialog', () => {
	it('renders details and a profile link for staff who can read patients', () => {
		render(
			<AppointmentEventDialog
				appointment={appointment}
				permissions={DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN}
				onClose={vi.fn()}
			/>,
		);

		expect(screen.getByRole('dialog', {name: 'Appointment'})).toHaveTextContent('Office visit');
		expect(screen.getByRole('link', {name: 'View patient profile'})).toHaveAttribute(
			'href',
			'/dashboard/patients/demo-patient-001',
		);
		expect(screen.queryByRole('link', {name: 'Join visit'})).not.toBeInTheDocument();
	});

	it('omits the profile link without a patient read grant', () => {
		render(
			<AppointmentEventDialog
				appointment={appointment}
				permissions={DEFAULT_ROLE_PERMISSIONS.PATIENT}
				onClose={vi.fn()}
			/>,
		);

		expect(screen.queryByRole('link', {name: 'View patient profile'})).not.toBeInTheDocument();
	});

	it('calls onClose from the Close button', async () => {
		const onClose = vi.fn();
		const user = userEvent.setup();
		render(
			<AppointmentEventDialog
				appointment={appointment}
				permissions={DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN}
				onClose={onClose}
			/>,
		);

		await user.click(screen.getByRole('button', {name: 'Close'}));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('links a joinable telehealth visit', () => {
		const telehealthAppointment: Appointment = {
			...appointment,
			id: 'demo-appointment-002',
			type: 'telehealth',
			state: 'confirmed',
			patientName: 'Taylor Bennett',
			providerName: 'Dr. Casey Walsh',
		};

		render(
			<AppointmentEventDialog
				appointment={telehealthAppointment}
				permissions={DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN}
				userRole="PRACTICE_ADMIN"
				onClose={vi.fn()}
			/>,
		);

		expect(screen.getByRole('dialog', {name: 'Appointment'})).toHaveTextContent('Telehealth');
		expect(screen.getByRole('link', {name: 'Join visit'})).toHaveAttribute(
			'href',
			'/dashboard/telehealth/session-demo-appointment-002',
		);
	});

	it('omits join visit for a receptionist', () => {
		const telehealthAppointment: Appointment = {
			...appointment,
			id: 'demo-appointment-002',
			type: 'telehealth',
			state: 'confirmed',
		};

		render(
			<AppointmentEventDialog
				appointment={telehealthAppointment}
				permissions={DEFAULT_ROLE_PERMISSIONS.RECEPTIONIST}
				userRole="RECEPTIONIST"
				onClose={vi.fn()}
			/>,
		);

		expect(screen.queryByRole('link', {name: 'Join visit'})).not.toBeInTheDocument();
	});
});
