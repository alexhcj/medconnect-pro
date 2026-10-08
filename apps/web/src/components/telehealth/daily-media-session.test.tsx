import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DailyMediaSession} from '@/components/telehealth/daily-media-session';
import type {TelehealthSession} from '@/types/medical/telehealth-session';

const {useDailyMediaSession} = vi.hoisted(() => ({
	useDailyMediaSession: vi.fn(),
}));

vi.mock('@/lib/hooks/use-daily-media-session', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/lib/hooks/use-daily-media-session')>();
	return {
		...actual,
		useDailyMediaSession,
	};
});

const session: TelehealthSession = {
	id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
	appointmentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
	patientName: 'Avery Quinn',
	providerName: 'Dr. Jordan Ellis',
	start: '2026-10-16T16:00:00.000Z',
	end: '2026-10-16T16:30:00.000Z',
	type: 'telehealth',
	state: 'in_session',
	synthetic: true,
};

function media(overrides: Record<string, unknown> = {}) {
	return {
		connectionState: 'waiting_for_participant',
		cameraOn: true,
		microphoneOn: true,
		screenShareOn: false,
		localVideoTrack: null,
		remoteVideoTrack: null,
		screenShareTrack: null,
		remoteParticipantName: null,
		controlsEnabled: true,
		retry: vi.fn(),
		toggleCamera: vi.fn(),
		toggleMicrophone: vi.fn(),
		toggleScreenShare: vi.fn(),
		leaveAndDestroy: vi.fn().mockResolvedValue(undefined),
		...overrides,
	};
}

describe('DailyMediaSession', () => {
	it('shows presence waiting after Nest join', () => {
		useDailyMediaSession.mockReturnValue(media());
		render(
			<DailyMediaSession
				sessionId={session.id}
				session={session}
				userRole="PROVIDER"
				onEnd={vi.fn()}
				isEnding={false}
			/>,
		);

		expect(screen.getByRole('status')).toHaveTextContent('Waiting for the other participant');
		expect(screen.getAllByText('Waiting for the other participant').length).toBeGreaterThan(1);
		expect(screen.getByRole('button', {name: 'Camera'})).toHaveAttribute('aria-pressed', 'true');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('shows connected copy when a remote participant is present', () => {
		useDailyMediaSession.mockReturnValue(
			media({
				connectionState: 'connected',
				remoteParticipantName: 'Avery Quinn',
			}),
		);
		render(
			<DailyMediaSession
				sessionId={session.id}
				session={session}
				userRole="PROVIDER"
				onEnd={vi.fn()}
				isEnding={false}
			/>,
		);

		expect(screen.getByRole('status')).toHaveTextContent('Connected');
		expect(screen.getByText('Avery Quinn')).toBeInTheDocument();
	});

	it('labels unconfigured media without an error alert', () => {
		useDailyMediaSession.mockReturnValue(
			media({
				connectionState: 'not_configured',
				cameraOn: false,
				microphoneOn: false,
				controlsEnabled: false,
			}),
		);
		render(
			<DailyMediaSession
				sessionId={session.id}
				session={session}
				userRole="PROVIDER"
				onEnd={vi.fn()}
				isEnding={false}
			/>,
		);

		expect(screen.getByRole('status')).toHaveTextContent(
			'Live media is not configured in this environment',
		);
		expect(screen.getByText('This demo environment does not have live Daily media configured.')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Camera'})).toBeDisabled();
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('shows a failed alert with retry', async () => {
		const retry = vi.fn();
		useDailyMediaSession.mockReturnValue(
			media({
				connectionState: 'failed',
				cameraOn: false,
				microphoneOn: false,
				controlsEnabled: false,
				retry,
			}),
		);
		const user = userEvent.setup();
		render(
			<DailyMediaSession
				sessionId={session.id}
				session={session}
				userRole="PROVIDER"
				onEnd={vi.fn()}
				isEnding={false}
			/>,
		);

		expect(screen.getByRole('alert')).toHaveTextContent('Live media is currently unavailable.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));
		expect(retry).toHaveBeenCalledOnce();
	});

	it('leaves Daily then ends the Nest session', async () => {
		const leaveAndDestroy = vi.fn().mockResolvedValue(undefined);
		const onEnd = vi.fn();
		useDailyMediaSession.mockReturnValue(media({leaveAndDestroy}));
		const user = userEvent.setup();
		render(
			<DailyMediaSession
				sessionId={session.id}
				session={session}
				userRole="PROVIDER"
				onEnd={onEnd}
				isEnding={false}
			/>,
		);

		await user.click(screen.getByRole('button', {name: 'End session'}));
		expect(leaveAndDestroy).toHaveBeenCalledOnce();
		await vi.waitFor(() => {
			expect(onEnd).toHaveBeenCalledOnce();
		});
	});

	it('forwards camera, microphone, and screen share to Daily', async () => {
		const toggleCamera = vi.fn();
		const toggleMicrophone = vi.fn();
		const toggleScreenShare = vi.fn();
		useDailyMediaSession.mockReturnValue(media({toggleCamera, toggleMicrophone, toggleScreenShare}));
		const user = userEvent.setup();
		render(
			<DailyMediaSession
				sessionId={session.id}
				session={session}
				userRole="PROVIDER"
				onEnd={vi.fn()}
				isEnding={false}
			/>,
		);

		await user.click(screen.getByRole('button', {name: 'Camera'}));
		await user.click(screen.getByRole('button', {name: 'Microphone'}));
		await user.click(screen.getByRole('button', {name: 'Screen share'}));
		expect(toggleCamera).toHaveBeenCalledOnce();
		expect(toggleMicrophone).toHaveBeenCalledOnce();
		expect(toggleScreenShare).toHaveBeenCalledOnce();
	});
});
