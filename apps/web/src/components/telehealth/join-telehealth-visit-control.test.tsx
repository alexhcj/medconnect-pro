import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {JoinTelehealthVisitControl} from '@/components/telehealth/join-telehealth-visit-control';
import {ApiError} from '@/lib/api/http';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {DEFAULT_ROLE_PERMISSIONS} from '@/types/auth/permissions';

const {useCreateTelehealthSession, useFindOpenTelehealthSession, useSessionStatus, push} = vi.hoisted(() => ({
	useCreateTelehealthSession: vi.fn(),
	useFindOpenTelehealthSession: vi.fn(),
	useSessionStatus: vi.fn(),
	push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({push}),
}));

vi.mock('@/lib/hooks/use-telehealth', () => ({
	useCreateTelehealthSession,
	useFindOpenTelehealthSession,
}));

vi.mock('@/lib/hooks/use-session', () => ({
	useSessionStatus,
}));

vi.mock('@/lib/api/mocks/runtime', () => ({
	isMockMode: vi.fn(() => true),
}));

const appointmentId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const sessionId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function idleMutation() {
	return {
		mutate: vi.fn(),
		isPending: false,
		isError: false,
		error: null,
	};
}

describe('JoinTelehealthVisitControl', () => {
	beforeEach(() => {
		push.mockReset();
		vi.mocked(isMockMode).mockReturnValue(true);
		useCreateTelehealthSession.mockReturnValue(idleMutation());
		useFindOpenTelehealthSession.mockReturnValue(idleMutation());
		useSessionStatus.mockReturnValue({
			session: {permissions: [...DEFAULT_ROLE_PERMISSIONS.PROVIDER]},
			isLoading: false,
		});
	});

	it('links to a derived session path when mocks are on', () => {
		render(<JoinTelehealthVisitControl appointmentId="demo-appointment-002" />);

		expect(screen.getByRole('link', {name: 'Join visit'})).toHaveAttribute(
			'href',
			'/dashboard/telehealth/session-demo-appointment-002',
		);
		expect(useCreateTelehealthSession).not.toHaveBeenCalled();
		expect(useFindOpenTelehealthSession).not.toHaveBeenCalled();
	});

	it('creates a Nest session then navigates to the server UUID when mocks are off', async () => {
		vi.mocked(isMockMode).mockReturnValue(false);
		const create = idleMutation();
		const findOpen = idleMutation();
		useCreateTelehealthSession.mockReturnValue(create);
		useFindOpenTelehealthSession.mockReturnValue(findOpen);
		const user = userEvent.setup();
		render(<JoinTelehealthVisitControl appointmentId={appointmentId} />);

		await user.click(screen.getByRole('button', {name: 'Join visit'}));
		expect(create.mutate).toHaveBeenCalledWith(
			appointmentId,
			expect.objectContaining({onSuccess: expect.any(Function)}),
		);
		expect(findOpen.mutate).not.toHaveBeenCalled();
		create.mutate.mock.calls[0]?.[1]?.onSuccess({id: sessionId});
		expect(push).toHaveBeenCalledWith(`/dashboard/telehealth/${sessionId}`);
	});

	it('does not create while the session is still loading', async () => {
		vi.mocked(isMockMode).mockReturnValue(false);
		const create = idleMutation();
		useCreateTelehealthSession.mockReturnValue(create);
		useSessionStatus.mockReturnValue({session: undefined, isLoading: true});
		const user = userEvent.setup();
		render(<JoinTelehealthVisitControl appointmentId={appointmentId} />);

		expect(screen.getByRole('button', {name: 'Join visit'})).toBeDisabled();
		await user.click(screen.getByRole('button', {name: 'Join visit'}));
		expect(create.mutate).not.toHaveBeenCalled();
	});

	it('looks up the open session for a patient and does not create one', async () => {
		vi.mocked(isMockMode).mockReturnValue(false);
		const create = idleMutation();
		const findOpen = idleMutation();
		useCreateTelehealthSession.mockReturnValue(create);
		useFindOpenTelehealthSession.mockReturnValue(findOpen);
		useSessionStatus.mockReturnValue({
			session: {permissions: [...DEFAULT_ROLE_PERMISSIONS.PATIENT]},
			isLoading: false,
		});
		const user = userEvent.setup();
		render(<JoinTelehealthVisitControl appointmentId={appointmentId} />);

		await user.click(screen.getByRole('button', {name: 'Join visit'}));
		expect(findOpen.mutate).toHaveBeenCalledWith(
			appointmentId,
			expect.objectContaining({onSuccess: expect.any(Function)}),
		);
		expect(create.mutate).not.toHaveBeenCalled();
		findOpen.mutate.mock.calls[0]?.[1]?.onSuccess({id: sessionId});
		expect(push).toHaveBeenCalledWith(`/dashboard/telehealth/${sessionId}`);
	});

	it('says the visit is not open yet when lookup is not found', () => {
		vi.mocked(isMockMode).mockReturnValue(false);
		const create = idleMutation();
		useCreateTelehealthSession.mockReturnValue(create);
		useFindOpenTelehealthSession.mockReturnValue({
			mutate: vi.fn(),
			isPending: false,
			isError: true,
			error: new ApiError('Telehealth session was not found.', 404, {code: 'NOT_FOUND'}),
		});
		useSessionStatus.mockReturnValue({
			session: {permissions: [...DEFAULT_ROLE_PERMISSIONS.NURSE]},
			isLoading: false,
		});
		render(<JoinTelehealthVisitControl appointmentId={appointmentId} />);

		expect(screen.getByRole('status')).toHaveTextContent('This visit is not open yet.');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		expect(create.mutate).not.toHaveBeenCalled();
	});

	it('surfaces a Nest 403 when live create is forbidden', () => {
		vi.mocked(isMockMode).mockReturnValue(false);
		useCreateTelehealthSession.mockReturnValue({
			mutate: vi.fn(),
			isPending: false,
			isError: true,
			error: new ApiError('You do not have permission to perform this action', 403, {
				code: 'FORBIDDEN',
			}),
		});
		render(<JoinTelehealthVisitControl appointmentId={appointmentId} />);

		expect(screen.getByRole('alert')).toHaveTextContent(
			'You do not have permission to perform this action',
		);
	});

	it('surfaces a Nest 409 when live create fails', () => {
		vi.mocked(isMockMode).mockReturnValue(false);
		useCreateTelehealthSession.mockReturnValue({
			mutate: vi.fn(),
			isPending: false,
			isError: true,
			error: new ApiError('A telehealth session for this appointment has already ended.', 409, {
				code: 'SESSION_ENDED',
			}),
		});
		render(<JoinTelehealthVisitControl appointmentId={appointmentId} />);

		expect(screen.getByRole('alert')).toHaveTextContent(
			'A telehealth session for this appointment has already ended.',
		);
	});
});
