import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {JoinTelehealthVisitControl} from '@/components/telehealth/join-telehealth-visit-control';
import {ApiError} from '@/lib/api/http';
import {isMockMode} from '@/lib/api/mocks/runtime';

const {useCreateTelehealthSession, push} = vi.hoisted(() => ({
	useCreateTelehealthSession: vi.fn(),
	push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({push}),
}));

vi.mock('@/lib/hooks/use-telehealth', () => ({
	useCreateTelehealthSession,
}));

vi.mock('@/lib/api/mocks/runtime', () => ({
	isMockMode: vi.fn(() => true),
}));

describe('JoinTelehealthVisitControl', () => {
	beforeEach(() => {
		push.mockReset();
		vi.mocked(isMockMode).mockReturnValue(true);
		useCreateTelehealthSession.mockReturnValue({
			mutate: vi.fn(),
			isPending: false,
			isError: false,
			error: null,
		});
	});

	it('links to a derived session path when mocks are on', () => {
		render(<JoinTelehealthVisitControl appointmentId="demo-appointment-002" />);

		expect(screen.getByRole('link', {name: 'Join visit'})).toHaveAttribute(
			'href',
			'/dashboard/telehealth/session-demo-appointment-002',
		);
		expect(useCreateTelehealthSession).not.toHaveBeenCalled();
	});

	it('creates a Nest session then navigates to the server UUID when mocks are off', async () => {
		vi.mocked(isMockMode).mockReturnValue(false);
		const mutate = vi.fn();
		useCreateTelehealthSession.mockReturnValue({
			mutate,
			isPending: false,
			isError: false,
			error: null,
		});
		const user = userEvent.setup();
		render(<JoinTelehealthVisitControl appointmentId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" />);

		await user.click(screen.getByRole('button', {name: 'Join visit'}));
		expect(mutate).toHaveBeenCalledWith(
			'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
			expect.objectContaining({onSuccess: expect.any(Function)}),
		);
		mutate.mock.calls[0]?.[1]?.onSuccess({id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'});
		expect(push).toHaveBeenCalledWith('/dashboard/telehealth/dddddddd-dddd-4ddd-8ddd-dddddddddddd');
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
		render(<JoinTelehealthVisitControl appointmentId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" />);

		expect(screen.getByRole('alert')).toHaveTextContent(
			'A telehealth session for this appointment has already ended.',
		);
	});
});
