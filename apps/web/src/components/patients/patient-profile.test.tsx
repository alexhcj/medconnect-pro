import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {PatientProfile} from '@/components/patients/patient-profile';
import {DEFAULT_ROLE_PERMISSIONS} from '@/types/auth/permissions';
import {Patient} from '@/types/medical/patient';

const {
	useSessionStatus,
	usePatient,
	usePatientHistory,
	usePatientVitals,
	usePatientMedications,
	usePatientDocuments,
	useProvider,
} = vi.hoisted(() => ({
	useSessionStatus: vi.fn(),
	usePatient: vi.fn(),
	usePatientHistory: vi.fn(),
	usePatientVitals: vi.fn(),
	usePatientMedications: vi.fn(),
	usePatientDocuments: vi.fn(),
	useProvider: vi.fn(),
}));

vi.mock('@/lib/hooks/use-session', () => ({
	useSessionStatus,
}));

vi.mock('@/lib/hooks/use-medical', () => ({
	usePatient,
	usePatientHistory,
	usePatientVitals,
	usePatientMedications,
	usePatientDocuments,
	useProvider,
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

function queryState(overrides: Record<string, unknown> = {}) {
	return {
		data: undefined,
		isPending: false,
		isError: false,
		refetch: vi.fn(),
		...overrides,
	};
}

function mockSession(permissions: readonly string[]) {
	useSessionStatus.mockReturnValue({
		session: {permissions},
		isLoading: false,
	});
}

function mockClinicalQueries() {
	usePatientHistory.mockReturnValue(queryState({data: []}));
	usePatientVitals.mockReturnValue(queryState({data: []}));
	usePatientMedications.mockReturnValue(queryState({data: []}));
	usePatientDocuments.mockReturnValue(queryState({data: []}));
	useProvider.mockReturnValue(queryState({data: {displayName: 'Dr. Jordan Ellis'}}));
}

describe('PatientProfile', () => {
	it('shows a loading state before the patient arrives', () => {
		mockSession(DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN);
		usePatient.mockReturnValue(queryState({isPending: true}));
		mockClinicalQueries();

		render(<PatientProfile patientId="demo-patient-001" />);

		expect(screen.getByText('Loading patient')).toBeInTheDocument();
		expect(screen.queryByRole('heading', {level: 2, name: 'Demographics'})).not.toBeInTheDocument();
	});

	it('shows an error alert and retries when the patient cannot be loaded', async () => {
		const refetch = vi.fn();
		mockSession(DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN);
		usePatient.mockReturnValue(queryState({isError: true, refetch}));
		mockClinicalQueries();
		const user = userEvent.setup();

		render(<PatientProfile patientId="missing-patient" />);
		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load this patient.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));

		expect(refetch).toHaveBeenCalledOnce();
	});

	it('shows demographics without clinical sections for a practice admin', () => {
		mockSession(DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN);
		usePatient.mockReturnValue(queryState({data: samplePatient}));
		mockClinicalQueries();

		render(<PatientProfile patientId="demo-patient-001" />);

		expect(screen.getByRole('heading', {level: 1, name: 'Avery Carter'})).toBeInTheDocument();
		expect(screen.getByRole('navigation', {name: 'Profile sections'})).toBeInTheDocument();
		expect(screen.getByRole('heading', {level: 2, name: 'Demographics'})).toBeInTheDocument();
		expect(screen.getByText('patient001@example.test')).toBeInTheDocument();
		expect(screen.getByText('Robin Carter')).toBeInTheDocument();
		expect(screen.getByText('Demo Health Partners')).toBeInTheDocument();
		expect(screen.getByText('Dr. Jordan Ellis')).toBeInTheDocument();
		expect(screen.getByRole('link', {name: 'Edit patient'})).toHaveAttribute(
			'href',
			'/dashboard/patients/demo-patient-001/edit',
		);
		expect(screen.getByRole('link', {name: 'Schedule appointment'})).toHaveAttribute(
			'href',
			'/dashboard/appointments/new?patientId=demo-patient-001',
		);
		expect(screen.queryByText('Hypertension')).not.toBeInTheDocument();
		expect(screen.queryByRole('heading', {level: 2, name: 'History'})).not.toBeInTheDocument();
		expect(screen.queryByRole('heading', {level: 2, name: 'Vitals'})).not.toBeInTheDocument();
		expect(screen.queryByRole('heading', {level: 2, name: 'Medications'})).not.toBeInTheDocument();
		expect(screen.queryByRole('heading', {level: 2, name: 'Documents'})).not.toBeInTheDocument();
		expect(usePatientHistory).toHaveBeenCalledWith('demo-patient-001', false);
		expect(usePatientVitals).toHaveBeenCalledWith('demo-patient-001', false);
		expect(usePatientMedications).toHaveBeenCalledWith('demo-patient-001', false);
		expect(usePatientDocuments).toHaveBeenCalledWith('demo-patient-001', false);
	});

	it('shows an empty history message without hiding demographics', () => {
		mockSession(DEFAULT_ROLE_PERMISSIONS.PROVIDER);
		usePatient.mockReturnValue(queryState({data: samplePatient}));
		mockClinicalQueries();
		usePatientHistory.mockReturnValue(queryState({data: []}));
		usePatientVitals.mockReturnValue(
			queryState({
				data: [
					{
						id: 'demo-vital-001',
						recordedAt: '2025-07-15T10:15:00Z',
						systolicMmHg: 128,
						diastolicMmHg: 82,
						heartRateBpm: 72,
						temperatureC: 36.7,
						respiratoryRate: 16,
						spo2Percent: 98,
						weightKg: 72.5,
					},
				],
			}),
		);

		render(<PatientProfile patientId="demo-patient-001" />);

		expect(screen.getByText('No history records.')).toBeInTheDocument();
		expect(screen.queryByRole('link', {name: 'Edit patient'})).not.toBeInTheDocument();
		expect(screen.getByRole('link', {name: 'Schedule appointment'})).toHaveAttribute(
			'href',
			'/dashboard/appointments/new?patientId=demo-patient-001',
		);
		expect(screen.getByRole('heading', {level: 2, name: 'Vitals'})).toBeInTheDocument();
		expect(screen.getByText('Blood pressure 128/82 mmHg')).toBeInTheDocument();
		expect(screen.getByText('patient001@example.test')).toBeInTheDocument();
		expect(usePatientHistory).toHaveBeenCalledWith('demo-patient-001', true);
		expect(usePatientVitals).toHaveBeenCalledWith('demo-patient-001', true);
	});

	it('keeps demographics visible when a clinical section fails', () => {
		mockSession(DEFAULT_ROLE_PERMISSIONS.PROVIDER);
		usePatient.mockReturnValue(queryState({data: samplePatient}));
		mockClinicalQueries();
		usePatientHistory.mockReturnValue(queryState({isError: true}));

		render(<PatientProfile patientId="demo-patient-001" />);

		expect(screen.getByText('patient001@example.test')).toBeInTheDocument();
		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load history.');
	});

	it('shows vitals for a nurse and hides medical-record sections', () => {
		mockSession(DEFAULT_ROLE_PERMISSIONS.NURSE);
		usePatient.mockReturnValue(queryState({data: samplePatient}));
		mockClinicalQueries();

		render(<PatientProfile patientId="demo-patient-001" />);

		expect(screen.getByRole('heading', {level: 2, name: 'Vitals'})).toBeInTheDocument();
		expect(screen.getByText('No vitals recorded.')).toBeInTheDocument();
		expect(screen.queryByRole('link', {name: 'Schedule appointment'})).not.toBeInTheDocument();
		expect(screen.queryByRole('heading', {level: 2, name: 'History'})).not.toBeInTheDocument();
		expect(screen.queryByRole('heading', {level: 2, name: 'Medications'})).not.toBeInTheDocument();
		expect(screen.queryByRole('heading', {level: 2, name: 'Documents'})).not.toBeInTheDocument();
		expect(usePatientHistory).toHaveBeenCalledWith('demo-patient-001', false);
		expect(usePatientVitals).toHaveBeenCalledWith('demo-patient-001', true);
		expect(usePatientMedications).toHaveBeenCalledWith('demo-patient-001', false);
		expect(usePatientDocuments).toHaveBeenCalledWith('demo-patient-001', false);
	});

	it('does not load a patient record without a staff profile grant', () => {
		mockSession(DEFAULT_ROLE_PERMISSIONS.PATIENT);
		usePatient.mockReturnValue(queryState());
		mockClinicalQueries();

		render(<PatientProfile patientId="demo-patient-001" />);

		expect(screen.getByText('You do not have access to patient profiles.')).toBeInTheDocument();
		expect(usePatient).toHaveBeenCalledWith('');
		expect(usePatientHistory).toHaveBeenCalledWith('demo-patient-001', false);
		expect(screen.queryByText('Hypertension')).not.toBeInTheDocument();
	});
});