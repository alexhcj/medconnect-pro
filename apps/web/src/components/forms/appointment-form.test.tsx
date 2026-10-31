import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AppointmentForm} from '@/components/forms/appointment-form';
import {chooseOption, getSelect} from '@/test/select';
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
	await chooseOption(user, 'Patient', 'Jordan Brooks');
	await chooseOption(user, 'Provider', 'Dr. Jordan Ellis');
	await user.type(screen.getByLabelText('Start date'), '10202026');
	await user.type(screen.getByRole('combobox', {name: 'Start time'}), '10:00 am');
	await user.tab();
	await user.clear(screen.getByRole('combobox', {name: 'End time'}));
	await user.type(screen.getByRole('combobox', {name: 'End time'}), '11:00 am');
	await user.tab();
	await chooseOption(user, 'Type', 'Office visit');
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

		const patient = getSelect('Patient');
		expect(patient).toHaveAttribute('aria-invalid', 'true');
		expect(patient).toHaveFocus();
		expect(document.getElementById('patientId-error')).toHaveTextContent('Select a patient');
		expect(patient).toHaveAttribute('aria-describedby', 'patientId-error');
		expect(screen.getByText('Select a patient')).toHaveAttribute('role', 'alert');
		expect(createMutate).not.toHaveBeenCalled();
	});

	it('renders the form inside a white bordered card with white fields', () => {
		const {container} = render(<AppointmentForm patients={patients} providers={providers} />);

		const card = container.querySelector('form > div');
		expect(card).toHaveClass('border-border', 'bg-surface');
		expect(card).toContainElement(screen.getByRole('heading', {level: 1, name: 'Schedule appointment'}));
		expect(card).toContainElement(screen.getByRole('button', {name: 'Schedule appointment'}));
		expect(getSelect('Patient')).toHaveClass('border-input', 'bg-surface', 'h-10');
		expect(screen.getByLabelText('Notes')).toHaveClass('border-input', 'bg-surface');
	});

	it('prefills a patient from the profile link', () => {
		render(<AppointmentForm patients={patients} providers={providers} prefilledPatientId="demo-patient-002" />);

		expect(getSelect('Patient')).toHaveTextContent('Jordan Brooks');
	});

	it('fills End 30 minutes after Start and keeps a valid End', async () => {
		const user = userEvent.setup();
		render(<AppointmentForm patients={patients} providers={providers} />);
		const startTime = screen.getByRole('combobox', {name: 'Start time'});

		await user.type(screen.getByLabelText('Start date'), '10202026');
		await user.type(startTime, '10:00 am');
		await user.tab();
		expect(screen.getByLabelText('End date')).toHaveValue('10/20/2026');
		expect(screen.getByRole('combobox', {name: 'End time'})).toHaveValue('10:30 AM');

		// An End that is still after the new Start is left alone.
		await user.clear(startTime);
		await user.type(startTime, '9:00 am');
		await user.tab();
		expect(screen.getByRole('combobox', {name: 'End time'})).toHaveValue('10:30 AM');

		// An End that is no longer after Start moves with it.
		await user.clear(startTime);
		await user.type(startTime, '11:00 am');
		await user.tab();
		expect(screen.getByRole('combobox', {name: 'End time'})).toHaveValue('11:30 AM');
	});

	it('sends the local ISO date-times the schema expects', async () => {
		const user = userEvent.setup();
		createMutate.mockResolvedValue({id: 'demo-appointment-new'});
		render(<AppointmentForm patients={patients} providers={providers} />);
		await fillCreateForm(user);
		await user.click(screen.getByRole('button', {name: 'Schedule appointment'}));

		expect(createMutate).toHaveBeenCalledWith(
			expect.objectContaining({
				start: new Date('2026-10-20T10:00').toISOString(),
				end: new Date('2026-10-20T11:00').toISOString(),
			}),
		);
	});

	it('shows End before Start as text on the End field', async () => {
		const user = userEvent.setup();
		render(<AppointmentForm patients={patients} providers={providers} />);
		await fillCreateForm(user);
		const endTime = screen.getByRole('combobox', {name: 'End time'});
		await user.clear(endTime);
		await user.type(endTime, '9:00 am');
		await user.tab();
		await user.click(screen.getByRole('button', {name: 'Schedule appointment'}));

		expect(await screen.findByText('End must be after start')).toHaveAttribute('role', 'alert');
		expect(createMutate).not.toHaveBeenCalled();
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
		expect(screen.getByLabelText('Start date')).toHaveAttribute('aria-invalid', 'true');
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
