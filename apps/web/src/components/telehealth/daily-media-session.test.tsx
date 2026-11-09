import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DailyMediaSession} from '@/components/telehealth/daily-media-session';
import type {StageTile} from '@/lib/telehealth/call-participants';
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

const {useVisitKeepAlive} = vi.hoisted(() => ({useVisitKeepAlive: vi.fn()}));
vi.mock('@/lib/telehealth/use-visit-keepalive', () => ({useVisitKeepAlive}));

const session: TelehealthSession = {
	id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
	appointmentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
	patientName: 'Avery Quinn',
	providerName: 'Dr. Jordan Ellis',
	start: '2026-10-16T16:00:00.000Z',
	end: '2026-10-16T16:30:00.000Z',
	type: 'telehealth',
	state: 'in_session',
	participants: [],
	viewerCanEnd: false,
	synthetic: true,
};

function tile(overrides: Partial<StageTile> = {}): StageTile {
	return {
		id: 'local',
		userId: 'u-provider',
		isLocal: true,
		name: 'You',
		role: 'PROVIDER',
		initials: 'You',
		audioOn: true,
		videoOn: false,
		videoTrack: null,
		network: 'good',
		speaking: false,
		...overrides,
	};
}

function media(overrides: Record<string, unknown> = {}) {
	return {
		connectionState: 'waiting_for_participant',
		cameraOn: true,
		microphoneOn: true,
		screenShareOn: false,
		tiles: [tile()],
		screenShare: null,
		activeSpeakerId: null,
		networkLevel: 'good',
		canShareScreen: true,
		devices: {cameras: [], microphones: [], speakers: []},
		background: {kind: 'none'},
		controlsEnabled: true,
		retry: vi.fn(),
		toggleCamera: vi.fn(),
		toggleMicrophone: vi.fn(),
		toggleScreenShare: vi.fn(),
		chooseDevice: vi.fn(),
		setBackground: vi.fn(),
		flipCamera: vi.fn(),
		leaveAndDestroy: vi.fn().mockResolvedValue(undefined),
		failureKind: 'none',
		...overrides,
	};
}

function renderSession(props: Partial<Parameters<typeof DailyMediaSession>[0]> = {}) {
	return render(
		<DailyMediaSession
			sessionId={session.id}
			session={session}
			visitTitle="Blood pressure follow-up · Avery Quinn"
			onEnd={vi.fn()}
			isEnding={false}
			canEnd
			{...props}
		/>,
	);
}

describe('DailyMediaSession', () => {
	beforeEach(() => {
		useVisitKeepAlive.mockClear();
		// The once-per-visit notice has its own tests below; the rest assert on the status strip alone.
		window.sessionStorage.setItem(`mcp:visit-keepalive-notice:${session.id}`, '1');
	});

	it('renders the full-screen stage with the header, encryption note and network quality', async () => {
		useDailyMediaSession.mockReturnValue(media());
		renderSession();

		expect(await screen.findByRole('region', {name: 'Video visit'})).toBeInTheDocument();
		expect(screen.getByRole('heading', {level: 1, name: 'Blood pressure follow-up · Avery Quinn'})).toBeInTheDocument();
		expect(screen.getByText('Encrypted connection · This visit is not recorded')).toBeInTheDocument();
		expect(screen.getByText('Demo · synthetic data')).toBeInTheDocument();
		expect(screen.getByRole('timer', {name: 'Elapsed visit time'})).toBeInTheDocument();
		expect(screen.getByText('Good')).toBeInTheDocument();
	});

	it('shows presence waiting after Nest join', async () => {
		useDailyMediaSession.mockReturnValue(media());
		renderSession();

		expect(await screen.findByRole('status')).toHaveTextContent('Waiting for the other participant');
		expect(screen.getAllByText('Waiting for the other participant').length).toBeGreaterThan(1);
		expect(screen.getByRole('button', {name: 'Camera'})).toHaveAttribute('aria-pressed', 'true');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('shows server-named tiles with role tags, state and weak network', async () => {
		useDailyMediaSession.mockReturnValue(
			media({
				connectionState: 'connected',
				tiles: [
					tile(),
					tile({id: 'r1', isLocal: false, name: 'Avery Quinn', role: 'PATIENT', initials: 'AQ', speaking: true}),
					tile({id: 'r2', isLocal: false, name: 'Riley Chen', role: 'NURSE', initials: 'RC', audioOn: false, network: 'poor'}),
				],
			}),
		);
		renderSession();

		const patient = await screen.findByRole('group', {name: 'Avery Quinn, Patient'});
		expect(within(patient).getByText('Patient')).toBeInTheDocument();
		expect(within(patient).getByText('Speaking')).toBeInTheDocument();
		const nurse = screen.getByRole('group', {name: 'Riley Chen, Nurse'});
		expect(within(nurse).getByText('Weak network')).toBeInTheDocument();
		expect(within(nurse).getByText('Microphone off')).toBeInTheDocument();
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});

	it('labels unconfigured media as an error without a retry', async () => {
		useDailyMediaSession.mockReturnValue(
			media({connectionState: 'not_configured', cameraOn: false, microphoneOn: false, controlsEnabled: false}),
		);
		renderSession();

		expect(await screen.findByRole('alert')).toHaveTextContent('Live media is not configured in this environment');
		expect(screen.getByRole('button', {name: 'Camera'})).toBeDisabled();
		expect(screen.queryByRole('button', {name: 'Retry'})).not.toBeInTheDocument();
	});

	it('shows a failed alert with retry', async () => {
		const retry = vi.fn();
		useDailyMediaSession.mockReturnValue(
			media({connectionState: 'failed', cameraOn: false, microphoneOn: false, controlsEnabled: false, retry}),
		);
		const user = userEvent.setup();
		renderSession();

		expect(await screen.findByRole('alert')).toHaveTextContent('Live media is currently unavailable.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));
		expect(retry).toHaveBeenCalledOnce();
	});

	it('announces a permission failure separately from generic media unavailable', async () => {
		useDailyMediaSession.mockReturnValue(
			media({
				connectionState: 'failed',
				failureKind: 'permission',
				cameraOn: false,
				microphoneOn: false,
				controlsEnabled: false,
			}),
		);
		renderSession();

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Camera or microphone access was denied. Allow access and retry.',
		);
	});

	it('asks before ending, then leaves Daily and ends the Nest session', async () => {
		const leaveAndDestroy = vi.fn().mockResolvedValue(undefined);
		const onEnd = vi.fn();
		useDailyMediaSession.mockReturnValue(media({leaveAndDestroy}));
		const user = userEvent.setup();
		renderSession({onEnd});

		await user.click(await screen.findByRole('button', {name: 'End visit'}));
		expect(leaveAndDestroy).not.toHaveBeenCalled();
		const dialog = await screen.findByRole('dialog', {name: 'End this visit for everyone?'});
		expect(within(dialog).getByRole('button', {name: 'Keep visit open'})).toHaveFocus();

		await user.click(within(dialog).getByRole('button', {name: 'End visit'}));
		expect(leaveAndDestroy).toHaveBeenCalledOnce();
		await vi.waitFor(() => {
			expect(onEnd).toHaveBeenCalledOnce();
		});
	});

	it('keeps the visit open when the host backs out of the confirmation', async () => {
		const onEnd = vi.fn();
		useDailyMediaSession.mockReturnValue(media());
		const user = userEvent.setup();
		renderSession({onEnd});

		await user.click(await screen.findByRole('button', {name: 'End visit'}));
		const dialog = await screen.findByRole('dialog');
		await user.click(within(dialog).getByRole('button', {name: 'Keep visit open'}));

		expect(onEnd).not.toHaveBeenCalled();
		await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});

	it('leaves the call without ending the Nest visit', async () => {
		const leaveAndDestroy = vi.fn().mockResolvedValue(undefined);
		const onEnd = vi.fn();
		useDailyMediaSession.mockReturnValue(media({leaveAndDestroy}));
		const user = userEvent.setup();
		renderSession({onEnd});

		await user.click(await screen.findByRole('button', {name: 'Leave call'}));
		expect(leaveAndDestroy).toHaveBeenCalledOnce();
		expect(onEnd).not.toHaveBeenCalled();
		await vi.waitFor(() => {
			expect(screen.getByText('You left the call. The visit is still open.')).toBeInTheDocument();
		});
		expect(screen.queryByRole('button', {name: 'Camera'})).not.toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'End visit'})).toBeInTheDocument();
	});

	it('hides End visit everywhere when the server says the viewer cannot end', async () => {
		useDailyMediaSession.mockReturnValue(media());
		renderSession({canEnd: false});

		expect(await screen.findByRole('button', {name: 'Leave call'})).toBeInTheDocument();
		expect(screen.queryByRole('button', {name: 'End visit'})).not.toBeInTheDocument();
	});

	it('forwards camera, microphone, and screen share to Daily without renaming the buttons', async () => {
		const toggleCamera = vi.fn();
		const toggleMicrophone = vi.fn();
		const toggleScreenShare = vi.fn();
		useDailyMediaSession.mockReturnValue(media({toggleCamera, toggleMicrophone, toggleScreenShare}));
		const user = userEvent.setup();
		renderSession();

		await user.click(await screen.findByRole('button', {name: 'Camera'}));
		await user.click(screen.getByRole('button', {name: 'Microphone'}));
		await user.click(screen.getByRole('button', {name: 'Share screen'}));
		expect(toggleCamera).toHaveBeenCalledOnce();
		expect(toggleMicrophone).toHaveBeenCalledOnce();
		expect(toggleScreenShare).toHaveBeenCalledOnce();
	});

	it('hides Share screen where the browser cannot share', async () => {
		useDailyMediaSession.mockReturnValue(media({canShareScreen: false}));
		renderSession();

		expect(await screen.findByRole('button', {name: 'Microphone'})).toBeInTheDocument();
		expect(screen.queryByRole('button', {name: 'Share screen'})).not.toBeInTheDocument();
	});

	it('uses a modifier for shortcuts and ignores a bare key', async () => {
		const toggleCamera = vi.fn();
		const toggleMicrophone = vi.fn();
		useDailyMediaSession.mockReturnValue(media({toggleCamera, toggleMicrophone}));
		const user = userEvent.setup();
		renderSession();
		await screen.findByRole('region', {name: 'Video visit'});

		await user.keyboard('mv');
		expect(toggleMicrophone).not.toHaveBeenCalled();
		expect(toggleCamera).not.toHaveBeenCalled();

		await user.keyboard('{Alt>}m{/Alt}');
		await user.keyboard('{Alt>}v{/Alt}');
		expect(toggleMicrophone).toHaveBeenCalledOnce();
		expect(toggleCamera).toHaveBeenCalledOnce();
	});

	it('opens the read-only participants panel with a count and closes it with Escape', async () => {
		useDailyMediaSession.mockReturnValue(
			media({
				connectionState: 'connected',
				tiles: [tile(), tile({id: 'r1', isLocal: false, name: 'Avery Quinn', role: 'PATIENT', initials: 'AQ'})],
			}),
		);
		const user = userEvent.setup();
		renderSession();

		await user.click(await screen.findByRole('button', {name: 'Participants'}));
		const panel = screen.getByRole('complementary', {name: 'Participants'});
		expect(within(panel).getByRole('heading', {name: 'Participants (2)'})).toBeInTheDocument();
		expect(within(panel).getByText('Only invited participants can join')).toBeInTheDocument();
		expect(within(panel).queryByRole('button', {name: /mute|remove|lock/i})).not.toBeInTheDocument();

		await user.keyboard('{Escape}');
		expect(screen.queryByRole('complementary', {name: 'Participants'})).not.toBeInTheDocument();
	});

	it('runs the keep-alive while joined and not after leaving the call', async () => {
		useDailyMediaSession.mockReturnValue(media({connectionState: 'connected'}));
		const user = userEvent.setup();
		renderSession();

		await screen.findByRole('region', {name: 'Video visit'});
		expect(useVisitKeepAlive).toHaveBeenLastCalledWith(expect.objectContaining({sessionId: session.id, active: true}));

		await user.click(screen.getByRole('button', {name: 'Leave call'}));
		await vi.waitFor(() => {
			expect(useVisitKeepAlive).toHaveBeenLastCalledWith(expect.objectContaining({active: false}));
		});
	});

	it('passes the ended-suspected and visit-closed callbacks through so the caller can re-read the session', async () => {
		useDailyMediaSession.mockReturnValue(media({connectionState: 'connected'}));
		const onEndedSuspected = vi.fn();
		const onVisitClosed = vi.fn();
		renderSession({onEndedSuspected, onVisitClosed});
		await screen.findByRole('region', {name: 'Video visit'});

		expect(useDailyMediaSession).toHaveBeenLastCalledWith(expect.objectContaining({onEndedSuspected}));
		expect(useVisitKeepAlive).toHaveBeenLastCalledWith(expect.objectContaining({onClosed: onVisitClosed}));
	});

	it('does not run the keep-alive before media has joined', async () => {
		useDailyMediaSession.mockReturnValue(media({connectionState: 'joining', controlsEnabled: false}));
		renderSession();

		await screen.findByRole('region', {name: 'Video visit'});
		expect(useVisitKeepAlive).toHaveBeenLastCalledWith(expect.objectContaining({active: false}));
	});

	it("shows the stay-signed-in notice once, politely, and keeps focus where it was", async () => {
		window.sessionStorage.clear();
		useDailyMediaSession.mockReturnValue(media({connectionState: 'connected'}));
		const user = userEvent.setup();
		renderSession();

		const notice = await screen.findByText(/You'll stay signed in while you're in a live visit/);
		expect(notice.closest('[role="status"]')).toHaveAttribute('aria-live', 'polite');
		expect(notice.closest('[role="status"]')).not.toContainElement(document.activeElement as HTMLElement);

		await user.click(screen.getByRole('button', {name: 'Got it'}));
		expect(screen.queryByText(/You'll stay signed in/)).not.toBeInTheDocument();
	});

	it('names who the viewer is waiting for', async () => {
		useDailyMediaSession.mockReturnValue(media());
		renderSession({viewerRole: 'PATIENT'});

		expect(await screen.findByRole('status')).toHaveTextContent('Waiting for Dr. Jordan Ellis to join…');
		expect(screen.getAllByText('Waiting for Dr. Jordan Ellis to join…').length).toBeGreaterThan(1);
	});

	it('offers Wait and End visit to the host when the other participant leaves', async () => {
		const withRemote = media({
			connectionState: 'connected',
			tiles: [tile(), tile({id: 'r1', isLocal: false, name: 'Avery Quinn', role: 'PATIENT', initials: 'AQ'})],
		});
		useDailyMediaSession.mockReturnValue(withRemote);
		const user = userEvent.setup();
		const view = renderSession({viewerRole: 'PROVIDER'});
		await screen.findByRole('region', {name: 'Video visit'});

		useDailyMediaSession.mockReturnValue(media({connectionState: 'waiting_for_participant'}));
		view.rerender(
			<DailyMediaSession
				sessionId={session.id}
				session={session}
				visitTitle="Blood pressure follow-up · Avery Quinn"
				onEnd={vi.fn()}
				isEnding={false}
				canEnd
				viewerRole="PROVIDER"
			/>,
		);

		const status = await screen.findByRole('status');
		expect(status).toHaveTextContent('Avery Quinn left the call.');
		expect(status).toHaveTextContent('The visit is still open.');
		expect(within(status).getByRole('button', {name: 'End visit'})).toBeInTheDocument();

		await user.click(within(status).getByRole('button', {name: 'Wait'}));
		expect(await screen.findByRole('status')).toHaveTextContent('Waiting for Avery Quinn to join…');
	});

	it('gives a participant who is not the host only Wait', async () => {
		useDailyMediaSession.mockReturnValue(
			media({
				connectionState: 'connected',
				tiles: [tile(), tile({id: 'r1', isLocal: false, name: 'Avery Quinn', role: 'PATIENT', initials: 'AQ'})],
			}),
		);
		const view = renderSession({canEnd: false, viewerRole: 'PATIENT'});
		await screen.findByRole('region', {name: 'Video visit'});

		useDailyMediaSession.mockReturnValue(media({connectionState: 'waiting_for_participant'}));
		view.rerender(
			<DailyMediaSession
				sessionId={session.id}
				session={session}
				visitTitle="Blood pressure follow-up · Avery Quinn"
				onEnd={vi.fn()}
				isEnding={false}
				canEnd={false}
				viewerRole="PATIENT"
			/>,
		);

		const status = await screen.findByRole('status');
		expect(within(status).getByRole('button', {name: 'Wait'})).toBeInTheDocument();
		expect(within(status).queryByRole('button', {name: 'End visit'})).not.toBeInTheDocument();
	});

	it('turns the camera off from the poor-network notice', async () => {
		const toggleCamera = vi.fn();
		useDailyMediaSession.mockReturnValue(
			media({
				connectionState: 'connected',
				networkLevel: 'poor',
				toggleCamera,
				tiles: [tile(), tile({id: 'r1', isLocal: false, name: 'Avery Quinn', role: 'PATIENT', initials: 'AQ'})],
			}),
		);
		const user = userEvent.setup();
		renderSession();

		const status = await screen.findByRole('status');
		expect(status).toHaveTextContent('Your network is weak. Turn off your camera to improve audio.');
		await user.click(within(status).getByRole('button', {name: 'Turn off camera'}));
		expect(toggleCamera).toHaveBeenCalledOnce();
	});

	it('announces lost device access as an alert with Retry devices', async () => {
		const retry = vi.fn();
		useDailyMediaSession.mockReturnValue(
			media({
				connectionState: 'connected',
				deviceLost: true,
				retry,
				tiles: [tile(), tile({id: 'r1', isLocal: false, name: 'Avery Quinn', role: 'PATIENT', initials: 'AQ'})],
			}),
		);
		const user = userEvent.setup();
		renderSession();

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('Camera or microphone access was lost. Allow access in your browser, then retry.');
		await user.click(within(alert).getByRole('button', {name: 'Retry devices'}));
		expect(retry).toHaveBeenCalledOnce();
	});

	it('shows both lines of the not-configured copy', async () => {
		useDailyMediaSession.mockReturnValue(
			media({connectionState: 'not_configured', cameraOn: false, microphoneOn: false, controlsEnabled: false}),
		);
		renderSession();

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('Live media is not configured in this environment');
		expect(alert).toHaveTextContent('This demo environment does not have live Daily media configured.');
	});

	it('opens the devices modal on the Background tab and applies a choice immediately', async () => {
		const setBackground = vi.fn();
		useDailyMediaSession.mockReturnValue(media({setBackground}));
		const user = userEvent.setup();
		renderSession();

		await user.click(await screen.findByRole('button', {name: 'Background'}));
		const dialog = await screen.findByRole('dialog', {name: 'Devices'});
		expect(within(dialog).getByRole('tab', {name: 'Background', selected: true})).toBeInTheDocument();
		await user.click(within(dialog).getByRole('radio', {name: 'Blur'}));
		expect(setBackground).toHaveBeenCalledWith({kind: 'blur'});
	});
});
