import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AppointmentForm} from '@/components/forms/appointment-form';
import {ApiError} from '@/lib/api/http';
import {Patient} from '@/types/medical/patient';
import {Provider} from '@/types/medical/provider';

const {push, createMutate} = vi.hoisted(() => ({
	push: vi.fn(),
	createMutate: vi.fn(),
}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({push}),
}));

vi.mock('@/lib/hooks/use-medical', () => ({
	useCreateAppointment: () => ({mutateAsync: createMutate, isPending: false}),
}));

const providers: Provider[] = [
	{
		id: 'demo-provider-001',
		firstName: 'Jordan',
		lastName: 'Ellis',
		displayName: 'Dr. Jordan Ellis',
		specialty: 'Family Medicine',
		practiceId: 'demo-practice-001',
		synthetic: true,
	},
];

const patients: Patient[] = [
	{
		id: 'demo-patient-002',
		firstName: 'Jordan',
		lastName: 'Brooks',
		dateOfBirth: '1971-02-02',
		gender: 'male',
		status: 'active',
		phone: '+1-555-010-1001',
		email: 'patient002@example.test',
		address: {street: '101 Demo Oak Lane', city: 'Springfield', state: 'IL', postalCode: '62701'},
		emergencyContact: {name: 'Sam Brooks', relationship: 'Spouse', phone: '+1-555-010-2001'},
		insurance: {provider: 'Demo Health Partners', policyNumber: 'DEM-100002', groupNumber: 'GRP-DEMO-01'},
		practiceId: 'demo-practice-002',
		providerId: 'demo-provider-002',
		conditions: [],
		synthetic: true,
	},
];

async function fillCreateForm(user: ReturnType<typeof userEvent.setup>) {
	await user.selectOptions(screen.getByLabelText('Patient'), 'demo-patient-002');
	await user.selectOptions(screen.getByLabelText('Provider'), 'demo-provider-001');
	await user.type(screen.getByLabelText('Start'), '2026-10-20T10:00');
	await user.type(screen.getByLabelText('End'), '2026-10-20T11:00');
	await user.selectOptions(screen.getByLabelText('Type'), 'office_visit');
}

describe('AppointmentForm', () => {
	beforeEach(() => {
		push.mockReset();
		createMutate.mockReset();
	});

	it('announces required fields and focuses the first invalid field', async () => {
		const user = userEvent.setup();
		render(<AppointmentForm patients={patients} providers={providers} />);

		await user.click(screen.getByRole('button', {name: 'Schedule appointment'}));

		const patient = screen.getByLabelText('Patient');
		expect(patient).toHaveAttribute('aria-invalid', 'true');
		expect(patient).toHaveFocus();
		expect(document.getElementById('patientId-error')).toHaveTextContent('Select a patient');
		expect(patient).toHaveAttribute('aria-describedby', 'patientId-error');
		expect(screen.getByText('Select a patient')).toHaveAttribute('role', 'alert');
		expect(createMutate).not.toHaveBeenCalled();
	});

	it('prefills a patient from the profile link', () => {
		render(<AppointmentForm patients={patients} providers={providers} prefilledPatientId="demo-patient-002" />);

		expect(screen.getByLabelText('Patient')).toHaveValue('demo-patient-002');
	});

	it('maps conflict details onto the start field', async () => {
		const user = userEvent.setup();
		createMutate.mockRejectedValue(
			new ApiError('This time overlaps an existing appointment for the provider.', 409, {
				code: 'APPOINTMENT_CONFLICT',
				details: [{path: 'start', message: 'This time overlaps an existing appointment for the provider.'}],
			}),
		);
		render(<AppointmentForm patients={patients} providers={providers} />);
		await fillCreateForm(user);
		await user.click(screen.getByRole('button', {name: 'Schedule appointment'}));

		expect(
			await screen.findByText('This time overlaps an existing appointment for the provider.'),
		).toHaveAttribute('role', 'alert');
		expect(screen.getByLabelText('Start')).toHaveAttribute('aria-invalid', 'true');
		expect(push).not.toHaveBeenCalled();
	});

	it('shows a form alert when the server error has no field path', async () => {
		const user = userEvent.setup();
		createMutate.mockRejectedValue(new ApiError('Unable to schedule this appointment.', 500, {code: 'INTERNAL_ERROR'}));
		render(<AppointmentForm patients={patients} providers={providers} />);
		await fillCreateForm(user);
		await user.click(screen.getByRole('button', {name: 'Schedule appointment'}));

		expect(await screen.findByRole('alert')).toHaveTextContent('Unable to schedule this appointment.');
		expect(push).not.toHaveBeenCalled();
	});
});
