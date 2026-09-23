import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {PatientForm} from '@/components/forms/patient-form';
import {ApiError} from '@/lib/api/http';
import {Patient} from '@/types/medical/patient';
import {Provider} from '@/types/medical/provider';

const {push, createMutate, updateMutate} = vi.hoisted(() => ({
	push: vi.fn(),
	createMutate: vi.fn(),
	updateMutate: vi.fn(),
}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({push}),
}));

vi.mock('@/lib/hooks/use-medical', () => ({
	useCreatePatient: () => ({mutateAsync: createMutate, isPending: false}),
	useUpdatePatient: () => ({mutateAsync: updateMutate, isPending: false}),
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

const samplePatient: Patient = {
	id: 'demo-patient-001',
	firstName: 'Avery',
	lastName: 'Carter',
	dateOfBirth: '1970-01-01',
	gender: 'female',
	status: 'active',
	phone: '+1-555-010-1000',
	email: 'patient001@example.test',
	address: {street: '100 Demo Oak Lane', city: 'Springfield', state: 'IL', postalCode: '62701'},
	emergencyContact: {name: 'Robin Carter', relationship: 'Spouse', phone: '+1-555-010-2000'},
	insurance: {provider: 'Demo Health Partners', policyNumber: 'DEM-100001', groupNumber: 'GRP-DEMO-01'},
	practiceId: 'demo-practice-001',
	providerId: 'demo-provider-001',
	conditions: ['Hypertension'],
	synthetic: true,
};

async function fillCreateForm(user: ReturnType<typeof userEvent.setup>) {
	await user.type(screen.getByLabelText('First name'), 'Quinn');
	await user.type(screen.getByLabelText('Last name'), 'Harlow');
	await user.type(screen.getByLabelText('Date of birth'), '1991-03-04');
	await user.selectOptions(screen.getByLabelText('Gender'), 'non-binary');
	await user.type(screen.getByLabelText('Phone'), '+1-555-010-4242');
	await user.type(screen.getByLabelText('Email'), 'quinn.harlow@example.test');
	await user.type(screen.getByLabelText('Street'), '42 Demo Lane');
	await user.type(screen.getByLabelText('City'), 'Springfield');
	await user.type(screen.getByLabelText('State'), 'IL');
	await user.type(screen.getByLabelText('Postal code'), '62704');
	await user.type(screen.getByLabelText('Emergency contact name'), 'Alex Harlow');
	await user.type(screen.getByLabelText('Relationship'), 'Sibling');
	await user.type(screen.getByLabelText('Emergency phone'), '+1-555-010-4243');
	await user.type(screen.getByLabelText('Insurance provider'), 'Demo Health Partners');
	await user.type(screen.getByLabelText('Policy number'), 'DEM-424242');
	await user.type(screen.getByLabelText('Group number'), 'GRP-DEMO-42');
	await user.selectOptions(screen.getByLabelText('Assigned provider'), 'demo-provider-001');
}

describe('PatientForm', () => {
	beforeEach(() => {
		push.mockReset();
		createMutate.mockReset();
		updateMutate.mockReset();
	});

	it('announces required fields and focuses the first invalid field', async () => {
		const user = userEvent.setup();
		render(<PatientForm mode="create" providers={providers} />);

		await user.click(screen.getByRole('button', {name: 'Create patient'}));

		const firstName = screen.getByLabelText('First name');
		expect(firstName).toHaveAttribute('aria-invalid', 'true');
		expect(firstName).toHaveFocus();
		expect(document.getElementById('firstName-error')).toHaveTextContent('First name is required');
		expect(firstName).toHaveAttribute('aria-describedby', 'firstName-error');
		expect(screen.getByText('First name is required')).toHaveAttribute('role', 'alert');
		expect(createMutate).not.toHaveBeenCalled();
	});

	it('loads edit values from the patient record', () => {
		render(<PatientForm mode="edit" patient={samplePatient} providers={providers} />);

		expect(screen.getByRole('heading', {name: 'Edit patient'})).toBeInTheDocument();
		expect(screen.getByLabelText('First name')).toHaveValue('Avery');
		expect(screen.getByLabelText('Email')).toHaveValue('patient001@example.test');
		expect(screen.getByLabelText('Assigned provider')).toHaveValue('demo-provider-001');
		expect(screen.getByText('Synthetic demo data. Not a real medical record.')).toBeInTheDocument();
	});

	it('maps server field details onto the matching input', async () => {
		const user = userEvent.setup();
		createMutate.mockRejectedValue(
			new ApiError('Request validation failed', 400, {
				code: 'VALIDATION_ERROR',
				details: [{path: 'email', message: 'A patient with this email already exists'}],
			}),
		);
		render(<PatientForm mode="create" providers={providers} />);
		await fillCreateForm(user);
		await user.click(screen.getByRole('button', {name: 'Create patient'}));

		expect(await screen.findByText('A patient with this email already exists')).toHaveAttribute('role', 'alert');
		expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
		expect(push).not.toHaveBeenCalled();
	});

	it('shows a form alert when the server error has no field path', async () => {
		const user = userEvent.setup();
		createMutate.mockRejectedValue(new ApiError('Patient not found', 404, {code: 'NOT_FOUND'}));
		render(<PatientForm mode="create" providers={providers} />);
		await fillCreateForm(user);
		await user.click(screen.getByRole('button', {name: 'Create patient'}));

		expect(await screen.findByRole('alert')).toHaveTextContent('Patient not found');
		expect(push).not.toHaveBeenCalled();
	});
});