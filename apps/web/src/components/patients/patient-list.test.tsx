import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {PatientList} from '@/components/patients/patient-list';
import {DEFAULT_ROLE_PERMISSIONS} from '@/types/auth/permissions';
import {Patient} from '@/types/medical/patient';

const {usePatientSearch, useSessionStatus} = vi.hoisted(() => ({
	usePatientSearch: vi.fn(),
	useSessionStatus: vi.fn(),
}));

vi.mock('@/lib/hooks/use-medical', () => ({
	usePatientSearch,
}));

vi.mock('@/lib/hooks/use-session', () => ({
	useSessionStatus,
}));

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

function mockSearch(overrides: Record<string, unknown> = {}) {
	usePatientSearch.mockReturnValue({
		data: {pages: [{patients: [samplePatient], hasMore: true, nextPage: 2}]},
		isPending: false,
		isError: false,
		refetch: vi.fn(),
		fetchNextPage: vi.fn(),
		hasNextPage: true,
		isFetchingNextPage: false,
		...overrides,
	});
}

describe('PatientList', () => {
	beforeEach(() => {
		useSessionStatus.mockReturnValue({
			session: {permissions: DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN},
			isLoading: false,
		});
	});

	it('renders labeled controls, a patient row, and load more', () => {
		mockSearch();
		render(<PatientList />);

		expect(screen.getByLabelText('Search patients')).toBeInTheDocument();
		expect(screen.getByLabelText('Status')).toBeInTheDocument();
		expect(screen.getByLabelText('Sort by name')).toBeInTheDocument();
		expect(screen.getByRole('list', {name: 'Patients'})).toBeInTheDocument();
		expect(screen.getByText('Avery Carter')).toBeInTheDocument();
		expect(screen.getByRole('link', {name: 'View profile for Avery Carter'})).toHaveAttribute(
			'href',
			'/dashboard/patients/demo-patient-001',
		);
		expect(screen.getByRole('list', {name: 'Patients'})).toHaveTextContent('Active');
		expect(screen.getByRole('button', {name: 'Load more'})).toBeInTheDocument();
	});

	it('requests the next page from load more', async () => {
		const fetchNextPage = vi.fn();
		mockSearch({fetchNextPage});
		const user = userEvent.setup();

		render(<PatientList />);
		await user.click(screen.getByRole('button', {name: 'Load more'}));

		expect(fetchNextPage).toHaveBeenCalledOnce();
	});

	it('shows a loading state before the first page arrives', () => {
		mockSearch({
			data: undefined,
			isPending: true,
			hasNextPage: false,
		});

		render(<PatientList />);

		expect(screen.getByText('Loading patients')).toBeInTheDocument();
		expect(screen.queryByRole('list', {name: 'Patients'})).not.toBeInTheDocument();
	});

	it('shows an error alert and retries', async () => {
		const refetch = vi.fn();
		mockSearch({
			data: undefined,
			isError: true,
			hasNextPage: false,
			refetch,
		});
		const user = userEvent.setup();

		render(<PatientList />);
		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load patients.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));

		expect(refetch).toHaveBeenCalledOnce();
	});

	it('shows an empty message when nothing matches', () => {
		mockSearch({
			data: {pages: [{patients: [], hasMore: false}]},
			hasNextPage: false,
		});

		render(<PatientList />);

		expect(screen.getByText('No patients match your search.')).toBeInTheDocument();
		expect(screen.queryByRole('button', {name: 'Load more'})).not.toBeInTheDocument();
	});

	it('passes status and sort into the search hook', async () => {
		mockSearch();
		const user = userEvent.setup();

		render(<PatientList />);
		await user.selectOptions(screen.getByLabelText('Status'), 'inactive');
		await user.selectOptions(screen.getByLabelText('Sort by name'), 'name-desc');

		expect(usePatientSearch).toHaveBeenLastCalledWith({
			query: '',
			status: 'inactive',
			sort: 'name-desc',
		});
	});

	it('links practice admins to the create form', () => {
		mockSearch();
		render(<PatientList />);
		expect(screen.getByRole('link', {name: 'Add patient'})).toHaveAttribute('href', '/dashboard/patients/new');
	});

	it('hides create from a provider session', () => {
		useSessionStatus.mockReturnValue({
			session: {permissions: DEFAULT_ROLE_PERMISSIONS.PROVIDER},
			isLoading: false,
		});
		mockSearch();
		render(<PatientList />);
		expect(screen.queryByRole('link', {name: 'Add patient'})).not.toBeInTheDocument();
	});
});
