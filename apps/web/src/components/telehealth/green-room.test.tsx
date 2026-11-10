import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const {playTestTone, stopTone, startPersonaCamera} = vi.hoisted(() => ({
	playTestTone: vi.fn(),
	stopTone: vi.fn(),
	startPersonaCamera: vi.fn(),
}));

vi.mock('@/lib/api/mocks/runtime', () => ({isMockMode: () => true}));
vi.mock('@/lib/telehealth/persona-camera', () => ({startPersonaCamera}));
vi.mock('@/lib/telehealth/test-tone', () => ({playTestTone}));

import {GreenRoom} from '@/components/telehealth/green-room';

function renderRoom(overrides: Partial<Parameters<typeof GreenRoom>[0]> = {}) {
	const onJoin = vi.fn();
	render(
		<GreenRoom
			visitTitle="Video visit — Blood pressure follow-up"
			scheduleText="Today, 2:30 PM · Dr. Jordan Ellis with Avery Quinn"
			initials="JE"
			onJoin={onJoin}
			isJoining={false}
			{...overrides}
		/>,
	);
	return {onJoin};
}

describe('GreenRoom (mock mode)', () => {
	beforeEach(() => {
		playTestTone.mockReset();
		playTestTone.mockReturnValue({done: new Promise<void>(() => undefined), stop: stopTone});
		window.history.pushState({}, '', '/');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('shows the ready green room with a placeholder preview, pickers and honest checks', () => {
		renderRoom();

		expect(screen.getByRole('heading', {level: 2, name: 'Video visit — Blood pressure follow-up'})).toBeInTheDocument();
		expect(screen.getByRole('img', {name: /Camera preview placeholder/})).toBeInTheDocument();
		expect(screen.getByRole('button', {name: /Camera/})).toHaveTextContent('Integrated Camera');
		expect(screen.getByRole('button', {name: /Microphone/})).toHaveTextContent('Built-in Microphone');
		expect(screen.getByRole('button', {name: /Speaker/})).toHaveTextContent('Headphones');
		expect(screen.getByText('Ready to join')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Join visit'})).toBeEnabled();

		const checks = screen.getByRole('list', {name: 'Connection checks'});
		expect(within(checks).getByText('Browser supported')).toBeInTheDocument();
		expect(within(checks).getByText('Camera allowed')).toBeInTheDocument();
		expect(within(checks).getByText('Microphone allowed')).toBeInTheDocument();
		expect(within(checks).getByText('Checked after you join')).toBeInTheDocument();
		expect(screen.queryByText(/\d+\s?ms/)).not.toBeInTheDocument();
	});

	it('shows the chosen background behind the mock avatar', async () => {
		const user = userEvent.setup();
		renderRoom();
		await user.click(screen.getByRole('radio', {name: 'Image'}));
		await user.click(screen.getByRole('radio', {name: 'Nurse station'}));
		expect(screen.getByRole('img', {name: 'Camera preview placeholder, background Nurse station'})).toBeInTheDocument();
		await user.click(screen.getByRole('radio', {name: 'Blur'}));
		expect(screen.getByRole('img', {name: 'Camera preview placeholder, background blur'})).toBeInTheDocument();
	});

	it('exposes the level meter with a text alternative', () => {
		renderRoom();
		const meter = screen.getByRole('meter', {name: 'Microphone input level'});
		expect(meter).toHaveAttribute('aria-valuenow', '8');
		expect(meter).toHaveAttribute('aria-valuemax', '12');
		expect(meter).toHaveAttribute('aria-valuetext', '8 of 12');
		expect(screen.getByText('Microphone is picking up sound')).toBeInTheDocument();
	});

	it('uses the approved claim wording and never "secure", "private" or "end-to-end"', () => {
		const {container} = render(
			<GreenRoom
				visitTitle="Video visit"
				scheduleText="Today"
				initials="JE"
				onJoin={vi.fn()}
				isJoining={false}
			/>,
		);
		expect(screen.getAllByText('Encrypted connection. This visit is not recorded.').length).toBeGreaterThan(0);
		expect(container.textContent).not.toMatch(/\b(secure|private|end-to-end)\b/i);
	});

	it('announces status changes politely', () => {
		renderRoom();
		const live = document.querySelector('[aria-live="polite"]');
		expect(live).toHaveTextContent('Camera and microphone are ready.');
	});

	it('hands the chosen devices and background to the join', async () => {
		const user = userEvent.setup();
		const {onJoin} = renderRoom();

		await user.click(screen.getByRole('radio', {name: 'Image'}));
		await user.click(screen.getByRole('radio', {name: 'Nurse station'}));
		await user.click(screen.getByRole('button', {name: 'Join visit'}));

		await waitFor(() => expect(onJoin).toHaveBeenCalledTimes(1));
		expect(onJoin).toHaveBeenCalledWith({
			audioOnly: false,
			cameraId: 'mock-camera',
			microphoneId: 'mock-microphone',
			speakerId: 'mock-speaker',
			background: {kind: 'image', imageId: 'nurse-station'},
		});
	});

	it('offers only None, Blur and the three built-in images (no upload, no URL)', async () => {
		const user = userEvent.setup();
		renderRoom();
		expect(screen.getAllByRole('radio').map((radio) => radio.textContent)).toEqual(['None', 'Blur', 'Image']);
		await user.click(screen.getByRole('radio', {name: 'Image'}));
		expect(screen.getByRole('radio', {name: 'Clinic exam room'})).toBeInTheDocument();
		expect(screen.getByRole('radio', {name: 'Nurse station'})).toBeInTheDocument();
		expect(screen.getByRole('radio', {name: 'Home living room'})).toBeInTheDocument();
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
		expect(document.querySelector('input[type="file"]')).toBeNull();
	});

	it('plays the test sound through the chosen speaker and shows progress', async () => {
		const user = userEvent.setup();
		renderRoom();
		await user.click(screen.getByRole('button', {name: 'Play test sound'}));
		expect(playTestTone).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('button', {name: 'Playing test sound…'})).toBeInTheDocument();
	});

	it('shows the blocked state and joins with audio only', async () => {
		window.history.pushState({}, '', '/?prejoin=blocked');
		const user = userEvent.setup();
		const {onJoin} = renderRoom();

		expect(screen.getByRole('heading', {name: 'Camera and microphone are blocked'})).toBeInTheDocument();
		expect(screen.getAllByText('Camera blocked').length).toBeGreaterThan(0);
		expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0');
		expect(within(screen.getByRole('list', {name: 'Connection checks'})).getByText('Camera blocked')).toBeInTheDocument();
		expect(within(screen.getByRole('list', {name: 'Connection checks'})).getByText('Microphone blocked')).toBeInTheDocument();

		const joins = screen.getAllByRole('button', {name: 'Join with audio only'});
		await user.click(joins[joins.length - 1]);
		await waitFor(() => expect(onJoin).toHaveBeenCalledTimes(1));
		expect(onJoin.mock.calls[0][0]).toMatchObject({audioOnly: true, background: {kind: 'none'}});
	});

	it('leaves the blocked state with Try again', async () => {
		window.history.pushState({}, '', '/?prejoin=blocked');
		const user = userEvent.setup();
		renderRoom();
		await user.click(screen.getByRole('button', {name: 'Try again'}));
		expect(screen.queryByRole('heading', {name: 'Camera and microphone are blocked'})).not.toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Join visit'})).toBeEnabled();
	});

	it('shows the no-camera state with the microphone still working', () => {
		window.history.pushState({}, '', '/?prejoin=no_camera');
		renderRoom();
		expect(screen.getByRole('heading', {name: 'No camera found'})).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Check again'})).toBeInTheDocument();
		expect(screen.getByText('No camera')).toBeInTheDocument();
		expect(within(screen.getByRole('list', {name: 'Connection checks'})).getByText('No camera found')).toBeInTheDocument();
		expect(screen.getByText('Microphone allowed')).toBeInTheDocument();
		expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '8');
		for (const button of screen.getAllByRole('button', {name: 'Join with audio only'})) {
			expect(button).toBeEnabled();
		}
	});

	it('disables Join while checking', () => {
		window.history.pushState({}, '', '/?prejoin=checking');
		renderRoom();
		expect(screen.getByText('Checking camera and microphone…', {selector: 'p'})).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Join visit'})).toBeDisabled();
		expect(screen.getAllByText('Checking…').length).toBeGreaterThan(0);
	});

	it('announces a join error', () => {
		renderRoom({errorMessage: 'Too many attempts. Try again later.'});
		expect(screen.getByRole('alert')).toHaveTextContent('Too many attempts. Try again later.');
	});

	it('sends nothing about devices, network or background over the network', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, 'open');
		const beaconSpy = vi.fn();
		Object.defineProperty(navigator, 'sendBeacon', {value: beaconSpy, configurable: true});
		const user = userEvent.setup();
		const {onJoin} = renderRoom();

		await user.click(screen.getByRole('radio', {name: 'Blur'}));
		await user.click(screen.getByRole('button', {name: 'Play test sound'}));
		await user.click(screen.getByRole('button', {name: 'Join visit'}));
		await waitFor(() => expect(onJoin).toHaveBeenCalled());

		expect(fetchSpy).not.toHaveBeenCalled();
		expect(xhrSpy).not.toHaveBeenCalled();
		expect(beaconSpy).not.toHaveBeenCalled();
	});
});

describe('GreenRoom demo persona camera (FE-065)', () => {
	const track = {kind: 'video', stop: vi.fn()} as unknown as MediaStreamTrack;
	const handle = {
		track,
		stream: {} as MediaStream,
		setBackground: vi.fn(async () => undefined),
		setReducedMotion: vi.fn(),
		stop: vi.fn(),
	};

	beforeEach(() => {
		playTestTone.mockReset();
		playTestTone.mockReturnValue({done: new Promise<void>(() => undefined), stop: stopTone});
		startPersonaCamera.mockReset();
		startPersonaCamera.mockResolvedValue(handle);
		handle.stop.mockClear();
		handle.setBackground.mockClear();
		window.history.pushState({}, '', '/');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it.each([[undefined], ['false'], ['TRUE'], ['1']])(
		'has no persona option when NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS is %s',
		(value) => {
			if (value !== undefined) {
				vi.stubEnv('NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS', value);
			}
			renderRoom({personaKey: 'provider-jordan-ellis'});
			expect(screen.queryByRole('radiogroup', {name: 'Camera source'})).not.toBeInTheDocument();
			expect(screen.queryByText(/Demo persona camera/)).not.toBeInTheDocument();
			expect(screen.queryByTestId('persona-demo-banner')).not.toBeInTheDocument();
		},
	);

	it('has no persona option without a persona key even in a demo build', () => {
		vi.stubEnv('NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS', 'true');
		renderRoom({personaKey: null});
		expect(screen.queryByRole('radiogroup', {name: 'Camera source'})).not.toBeInTheDocument();
	});

	it('defaults to My camera and shows the demo banner', () => {
		vi.stubEnv('NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS', 'true');
		renderRoom({personaKey: 'provider-jordan-ellis'});
		expect(screen.getByRole('radio', {name: 'My camera'})).toBeChecked();
		expect(screen.getByRole('radio', {name: 'Demo persona camera'})).not.toBeChecked();
		expect(screen.getByTestId('persona-demo-banner')).toBeInTheDocument();
		expect(startPersonaCamera).not.toHaveBeenCalled();
	});

	it.each([
		['provider-jordan-ellis', 'Jordan Ellis'],
		['nurse-riley-park', 'Riley Park'],
		['patient-avery-quinn', 'Avery Quinn'],
	] as const)('shows %s as the only selectable persona', async (key, cardName) => {
		vi.stubEnv('NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS', 'true');
		const user = userEvent.setup();
		renderRoom({personaKey: key, displayName: 'Name From Nest'});
		await user.click(screen.getByRole('radio', {name: 'Demo persona camera'}));

		const list = await screen.findByRole('list', {name: 'Demo personas'});
		const items = within(list).getAllByRole('listitem');
		expect(items).toHaveLength(3);
		expect(items.filter((item) => item.getAttribute('aria-current') === 'true')).toHaveLength(1);
		expect(items.filter((item) => item.getAttribute('aria-disabled') === 'true')).toHaveLength(2);
		const own = items.find((item) => item.getAttribute('aria-current') === 'true');
		expect(own).toHaveTextContent(cardName);
		expect(startPersonaCamera).toHaveBeenCalledWith(expect.objectContaining({personaKey: key}));
		// The displayed name always comes from the session, never from the persona.
		expect(await screen.findByLabelText(/Demo persona camera preview, Name From Nest, synthetic/)).toBeInTheDocument();
		expect(within(list).queryByRole('radio')).not.toBeInTheDocument();
	});

	it('labels the preview as synthetic and keeps the real camera private', async () => {
		vi.stubEnv('NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS', 'true');
		const user = userEvent.setup();
		renderRoom({personaKey: 'provider-jordan-ellis'});
		await user.click(screen.getByRole('radio', {name: 'Demo persona camera'}));
		expect((await screen.findAllByText('Demo · synthetic camera')).length).toBeGreaterThan(0);
		expect(screen.getByText('Your real camera stays private')).toBeInTheDocument();
		expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Demo persona camera on.');
	});

	it('hands the persona track to the join and keeps it running', async () => {
		vi.stubEnv('NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS', 'true');
		const user = userEvent.setup();
		const {onJoin} = renderRoom({personaKey: 'nurse-riley-park'});
		await user.click(screen.getByRole('radio', {name: 'Demo persona camera'}));
		await waitFor(() => expect(screen.getByRole('button', {name: 'Join visit'})).toBeEnabled());
		await user.click(screen.getByRole('button', {name: 'Join visit'}));
		await waitFor(() => expect(onJoin).toHaveBeenCalledTimes(1));
		expect(onJoin.mock.calls[0][0]).toMatchObject({audioOnly: false, videoSource: track, personaCamera: handle});
		expect(handle.stop).not.toHaveBeenCalled();
	});

	it('draws a chosen background into the persona instead of using Daily processing', async () => {
		vi.stubEnv('NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS', 'true');
		const user = userEvent.setup();
		const {onJoin} = renderRoom({personaKey: 'provider-jordan-ellis'});
		await user.click(screen.getByRole('radio', {name: 'Demo persona camera'}));
		await screen.findByRole('list', {name: 'Demo personas'});
		await user.click(screen.getByRole('radio', {name: 'Blur'}));
		expect(handle.setBackground).toHaveBeenCalledWith({kind: 'blur'});
		await user.click(screen.getByRole('button', {name: 'Join visit'}));
		await waitFor(() => expect(onJoin).toHaveBeenCalled());
		expect(onJoin.mock.calls[0][0]).toMatchObject({background: {kind: 'blur'}, videoSource: track});
	});

	it('stops the persona when switching back to My camera', async () => {
		vi.stubEnv('NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS', 'true');
		const user = userEvent.setup();
		renderRoom({personaKey: 'provider-jordan-ellis'});
		await user.click(screen.getByRole('radio', {name: 'Demo persona camera'}));
		await screen.findByRole('list', {name: 'Demo personas'});
		await user.click(screen.getByRole('radio', {name: 'My camera'}));
		expect(handle.stop).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole('list', {name: 'Demo personas'})).not.toBeInTheDocument();
	});

	it('falls back to My camera with a notice when the persona cannot start', async () => {
		vi.stubEnv('NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS', 'true');
		startPersonaCamera.mockRejectedValue(new Error('unsupported'));
		const user = userEvent.setup();
		renderRoom({personaKey: 'provider-jordan-ellis'});
		await user.click(screen.getByRole('radio', {name: 'Demo persona camera'}));
		const notice = await screen.findByText('Persona camera unavailable. Using your camera.', {selector: 'p'});
		expect(notice).toHaveAttribute('role', 'status');
		expect(screen.getByRole('radio', {name: 'My camera'})).toBeChecked();
	});

	it('sends nothing about the persona choice over the network', async () => {
		vi.stubEnv('NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS', 'true');
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const user = userEvent.setup();
		const {onJoin} = renderRoom({personaKey: 'provider-jordan-ellis'});
		await user.click(screen.getByRole('radio', {name: 'Demo persona camera'}));
		await waitFor(() => expect(screen.getByRole('button', {name: 'Join visit'})).toBeEnabled());
		await user.click(screen.getByRole('button', {name: 'Join visit'}));
		await waitFor(() => expect(onJoin).toHaveBeenCalled());
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});
