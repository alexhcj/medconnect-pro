import {render, screen} from '@testing-library/react';
import NewAppointmentPage from '@/app/(dashboard)/dashboard/appointments/new/page';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {DEFAULT_ROLE_PERMISSIONS} from '@/types/auth/permissions';

const {useSessionStatus, useProviders, usePatientSearch, usePatient, useCreateAppointment} = vi.hoisted(() => ({
	useSessionStatus: vi.fn(),
	useProviders: vi.fn(),
	usePatientSearch: vi.fn(),
	usePatient: vi.fn(),
	useCreateAppointment: vi.fn(),
}));

vi.mock('next/navigation', () => ({
	useSearchParams: () => ({get: () => null}),
	useRouter: () => ({push: vi.fn()}),
}));

vi.mock('@/lib/hooks/use-session', () => ({
	useSessionStatus,
}));

vi.mock('@/lib/hooks/use-medical', () => ({
	useProviders,
	usePatientSearch,
	usePatient,
	useCreateAppointment,
}));

vi.mock('@/lib/api/mocks/runtime', () => ({
	isMockMode: vi.fn(() => true),
}));

function queryState(overrides: Record<string, unknown> = {}) {
	return {
		data: undefined,
		isPending: false,
		isError: false,
		refetch: vi.fn(),
		...overrides,
	};
}

describe('NewAppointmentPage', () => {
	beforeEach(() => {
		vi.mocked(isMockMode).mockReturnValue(true);
		useProviders.mockReturnValue(queryState({data: []}));
		usePatientSearch.mockReturnValue(queryState({data: {pages: [{patients: []}]}}));
		usePatient.mockReturnValue(queryState());
		useCreateAppointment.mockReturnValue({mutateAsync: vi.fn(), isPending: false});
	});

	it('denies a session without write:appointments', () => {
		useSessionStatus.mockReturnValue({
			session: {permissions: DEFAULT_ROLE_PERMISSIONS.NURSE},
			isLoading: false,
		});

		render(<NewAppointmentPage />);

		expect(screen.getByRole('status')).toHaveTextContent('You do not have access to create appointments.');
		expect(screen.queryByRole('button', {name: 'Schedule appointment'})).not.toBeInTheDocument();
	});

	it('renders the schedule form when mocks are off', () => {
		vi.mocked(isMockMode).mockReturnValue(false);
		useSessionStatus.mockReturnValue({
			session: {permissions: DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN},
			isLoading: false,
		});

		render(<NewAppointmentPage />);

		expect(screen.getByRole('heading', {level: 1, name: 'Schedule appointment'})).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Schedule appointment'})).toBeInTheDocument();
		expect(screen.queryByText(/mock-only until the appointment API is available/)).not.toBeInTheDocument();
	});
});
