import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {PatientList} from '@/components/patients/patient-list';
import {DEFAULT_ROLE_PERMISSIONS} from '@/types/auth/permissions';
import {Patient} from '@/types/medical/patient';

const {usePatientPage, useSessionStatus, useListUrlState, setPage, setFilters} = vi.hoisted(() => ({
	usePatientPage: vi.fn(),
	useSessionStatus: vi.fn(),
	useListUrlState: vi.fn(),
	setPage: vi.fn(),
	setFilters: vi.fn(),
}));

vi.mock('@/lib/hooks/use-medical', () => ({
	usePatientPage,
}));

vi.mock('@/lib/hooks/use-session', () => ({
	useSessionStatus,
}));

vi.mock('@/lib/admin/use-list-url-state', () => ({
	useListUrlState,
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

function mockUrl(page = 1, filters: Record<string, string | undefined> = {}) {
	useListUrlState.mockReturnValue({page, filters, setPage, setFilters});
}

function mockPage(overrides: Record<string, unknown> = {}) {
	usePatientPage.mockReturnValue({
		data: {patients: [samplePatient], hasMore: true, nextPage: 2},
		isPending: false,
		isError: false,
		isPlaceholderData: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('PatientList', () => {
	beforeEach(() => {
		setPage.mockClear();
		setFilters.mockClear();
		usePatientPage.mockReset();
		mockUrl();
		useSessionStatus.mockReturnValue({
			session: {permissions: DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN},
			isLoading: false,
		});
	});

	it('renders labeled controls, a patient row, and the pager', () => {
		mockPage();
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
		expect(screen.getByRole('navigation', {name: 'Patients pagination'})).toBeInTheDocument();
		expect(screen.getByTestId('pagination-status')).toHaveTextContent('Showing 1–1');
		expect(screen.queryByRole('button', {name: 'Load more'})).not.toBeInTheDocument();
	});

	it('asks the hook for the page, filters and sort from the URL', () => {
		mockUrl(3, {q: 'avery', status: 'inactive', sort: 'name-desc'});
		mockPage();
		render(<PatientList />);

		expect(usePatientPage).toHaveBeenLastCalledWith({
			query: 'avery',
			status: 'inactive',
			sort: 'name-desc',
			page: 3,
		});
		expect(screen.getByLabelText('Search patients')).toHaveValue('avery');
	});

	it('falls back to defaults for unknown status and sort values in the URL', () => {
		mockUrl(1, {status: 'archived', sort: 'dob'});
		mockPage();
		render(<PatientList />);

		expect(usePatientPage).toHaveBeenLastCalledWith({query: '', status: 'all', sort: 'name-asc', page: 1});
	});

	it('moves between pages through the URL', async () => {
		mockUrl(2);
		mockPage();
		const user = userEvent.setup();

		render(<PatientList />);
		await user.click(screen.getByRole('button', {name: 'Next page'}));
		await user.click(screen.getByRole('button', {name: 'Previous page'}));

		expect(setPage).toHaveBeenNthCalledWith(1, 3);
		expect(setPage).toHaveBeenNthCalledWith(2, 1);
	});

	it('shows the range for a later page and disables Next on the last page', () => {
		mockUrl(3);
		mockPage({data: {patients: [samplePatient], hasMore: false}});
		render(<PatientList />);

		expect(screen.getByTestId('pagination-status')).toHaveTextContent('Showing 21–21');
		expect(screen.getByRole('button', {name: 'Next page'})).toBeDisabled();
		expect(screen.getByRole('button', {name: 'Previous page'})).toBeEnabled();
	});

	it('hides the pager when everything fits on one page', () => {
		mockPage({data: {patients: [samplePatient], hasMore: false}});
		render(<PatientList />);

		expect(screen.queryByRole('navigation', {name: 'Patients pagination'})).not.toBeInTheDocument();
	});

	it('disables the pager while the next page loads', () => {
		mockUrl(2);
		mockPage({isPlaceholderData: true});
		render(<PatientList />);

		expect(screen.getByRole('button', {name: 'Next page'})).toBeDisabled();
		expect(screen.getByRole('button', {name: 'Previous page'})).toBeDisabled();
	});

	it('shows a loading state before the first page arrives', () => {
		mockPage({data: undefined, isPending: true});

		render(<PatientList />);

		expect(screen.getByText('Loading patients')).toBeInTheDocument();
		expect(screen.queryByRole('list', {name: 'Patients'})).not.toBeInTheDocument();
		expect(screen.queryByRole('navigation', {name: 'Patients pagination'})).not.toBeInTheDocument();
	});

	it('shows an error alert and retries', async () => {
		const refetch = vi.fn();
		mockPage({data: undefined, isError: true, refetch});
		const user = userEvent.setup();

		render(<PatientList />);
		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load patients.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));

		expect(refetch).toHaveBeenCalledOnce();
		expect(screen.queryByRole('navigation', {name: 'Patients pagination'})).not.toBeInTheDocument();
	});

	it('shows an empty message when nothing matches', () => {
		mockPage({data: {patients: [], hasMore: false}});

		render(<PatientList />);

		expect(screen.getByText('No patients match your search.')).toBeInTheDocument();
		expect(screen.queryByRole('navigation', {name: 'Patients pagination'})).not.toBeInTheDocument();
	});

	it('keeps Previous available when a page past the end is empty', () => {
		mockUrl(9);
		mockPage({data: {patients: [], hasMore: false}});

		render(<PatientList />);

		expect(screen.getByText('No patients match your search.')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Previous page'})).toBeEnabled();
	});

	it('writes status and sort changes to the URL, which resets the page', async () => {
		mockPage();
		const user = userEvent.setup();

		render(<PatientList />);
		await user.selectOptions(screen.getByLabelText('Status'), 'inactive');
		expect(setFilters).toHaveBeenLastCalledWith({q: '', status: 'inactive', sort: undefined});

		await user.selectOptions(screen.getByLabelText('Sort by name'), 'name-desc');
		// The URL has not committed yet, so the earlier status change must not be lost.
		expect(setFilters).toHaveBeenLastCalledWith({q: '', status: 'inactive', sort: 'name-desc'});
	});

	it('writes the search term to the URL after the debounce', async () => {
		mockPage();
		const user = userEvent.setup();

		render(<PatientList />);
		await user.type(screen.getByLabelText('Search patients'), 'Avery');

		expect(setFilters).not.toHaveBeenCalled();
		await waitFor(() => expect(setFilters).toHaveBeenCalledTimes(1));
		expect(setFilters).toHaveBeenLastCalledWith({q: 'Avery', status: undefined, sort: undefined});
	});

	it('links practice admins to the create form', () => {
		mockPage();
		render(<PatientList />);
		expect(screen.getByRole('link', {name: 'Add patient'})).toHaveAttribute('href', '/dashboard/patients/new');
	});

	it('hides create from a provider session', () => {
		useSessionStatus.mockReturnValue({
			session: {permissions: DEFAULT_ROLE_PERMISSIONS.PROVIDER},
			isLoading: false,
		});
		mockPage();
		render(<PatientList />);
		expect(screen.queryByRole('link', {name: 'Add patient'})).not.toBeInTheDocument();
	});
});
