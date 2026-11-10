import {describe, expect, it, vi} from 'vitest';
import {
	PERSONA_HIDDEN_PAUSE_MS,
	idleTransform,
	levelFromTimeDomain,
	mouthOpenness,
	startPersonaCamera,
	type PersonaCameraDeps,
} from '@/lib/telehealth/persona-camera';

describe('persona motion helpers', () => {
	it('does not move at all with reduced motion', () => {
		expect(idleTransform(3.2, true)).toEqual({dy: 0, scale: 1});
		expect(mouthOpenness(1, true)).toBe(0);
	});

	it('sways a little otherwise', () => {
		const moved = idleTransform(1.2, false);
		expect(Math.abs(moved.dy)).toBeGreaterThan(0);
		expect(Math.abs(moved.dy)).toBeLessThanOrEqual(2.5);
		expect(Math.abs(moved.scale - 1)).toBeLessThan(0.01);
	});

	it('keeps the mouth closed for silence and opens it with level, capped at 1', () => {
		expect(mouthOpenness(0, false)).toBe(0);
		expect(mouthOpenness(0.05, false)).toBe(0);
		expect(mouthOpenness(0.3, false)).toBeGreaterThan(0);
		expect(mouthOpenness(5, false)).toBe(1);
		expect(mouthOpenness(Number.NaN, false)).toBe(0);
	});

	it('reads a level from time-domain audio bytes', () => {
		expect(levelFromTimeDomain(new Uint8Array(0))).toBe(0);
		expect(levelFromTimeDomain(new Uint8Array(64).fill(128))).toBe(0);
		expect(levelFromTimeDomain(Uint8Array.from({length: 64}, (_, i) => (i % 2 ? 255 : 1)))).toBeGreaterThan(0.9);
	});
});

function harness(overrides: Partial<PersonaCameraDeps> = {}) {
	const track = {stop: vi.fn(), kind: 'video'} as unknown as MediaStreamTrack;
	const stream = {getVideoTracks: () => [track]} as unknown as MediaStream;
	const ctx = {
		clearRect: vi.fn(),
		fillRect: vi.fn(),
		drawImage: vi.fn(),
		beginPath: vi.fn(),
		ellipse: vi.fn(),
		fill: vi.fn(),
		createLinearGradient: vi.fn(() => ({addColorStop: vi.fn()})),
		fillStyle: '',
	};
	const canvas = {
		width: 0,
		height: 0,
		getContext: () => ctx,
		captureStream: vi.fn(() => stream),
	} as unknown as HTMLCanvasElement;
	let frame: (() => void) | undefined;
	let clock = 0;
	const mic = {read: vi.fn(() => 0), close: vi.fn()};
	const deps: PersonaCameraDeps = {
		createCanvas: () => canvas,
		loadImage: vi.fn(async () => ({width: 760, height: 428}) as never),
		openMicrophone: vi.fn(async () => mic),
		now: () => clock,
		setInterval: (handler) => {
			frame = handler;
			return 1 as unknown as ReturnType<typeof setInterval>;
		},
		clearInterval: vi.fn(),
		isHidden: () => false,
		...overrides,
	};
	return {
		deps,
		ctx,
		canvas,
		track,
		mic,
		tick: (ms = 67) => {
			clock += ms;
			frame?.();
		},
		advance: (ms: number) => {
			clock += ms;
		},
	};
}

describe('startPersonaCamera', () => {
	it('draws the persona and captures a 15 fps video track', async () => {
		const h = harness();
		const handle = await startPersonaCamera({
			personaKey: 'provider-jordan-ellis',
			background: {kind: 'none'},
			reducedMotion: false,
			deps: h.deps,
		});
		expect(h.deps.loadImage).toHaveBeenCalledWith('/telehealth/personas/provider-jordan-ellis.svg');
		expect(h.canvas.captureStream).toHaveBeenCalledWith(15);
		expect(handle.track).toBe(h.track);
		expect(h.ctx.drawImage).toHaveBeenCalled();
		handle.stop();
	});

	it('opens the mouth from the microphone level and keeps it shut with reduced motion', async () => {
		const loud = harness();
		loud.mic.read.mockReturnValue(0.8);
		const handle = await startPersonaCamera({
			personaKey: 'nurse-riley-park',
			background: {kind: 'none'},
			reducedMotion: false,
			deps: loud.deps,
		});
		await Promise.resolve();
		loud.tick();
		loud.tick();
		expect(loud.ctx.ellipse).toHaveBeenCalled();
		handle.stop();

		const still = harness();
		still.mic.read.mockReturnValue(0.8);
		const calm = await startPersonaCamera({
			personaKey: 'nurse-riley-park',
			background: {kind: 'none'},
			reducedMotion: true,
			deps: still.deps,
		});
		await Promise.resolve();
		still.tick();
		still.tick();
		expect(still.ctx.ellipse).not.toHaveBeenCalled();
		calm.stop();
	});

	it('stops the track, the timer and the microphone, and only once', async () => {
		const h = harness();
		const handle = await startPersonaCamera({
			personaKey: 'patient-avery-quinn',
			background: {kind: 'none'},
			reducedMotion: false,
			deps: h.deps,
		});
		await Promise.resolve();
		handle.stop();
		handle.stop();
		expect(h.track.stop).toHaveBeenCalledTimes(1);
		expect(h.deps.clearInterval).toHaveBeenCalledTimes(1);
		expect(h.mic.close).toHaveBeenCalledTimes(1);
	});

	it('pauses drawing after the tab has been hidden a while and resumes when visible', async () => {
		let hidden = false;
		const h = harness({isHidden: () => hidden});
		const handle = await startPersonaCamera({
			personaKey: 'provider-jordan-ellis',
			background: {kind: 'none'},
			reducedMotion: false,
			deps: h.deps,
		});
		h.ctx.drawImage.mockClear();
		hidden = true;
		h.tick(); // hidden, but only just
		expect(h.ctx.drawImage).toHaveBeenCalledTimes(1);
		h.advance(PERSONA_HIDDEN_PAUSE_MS + 1);
		h.tick();
		h.tick();
		expect(h.ctx.drawImage).toHaveBeenCalledTimes(1);
		hidden = false;
		h.tick();
		expect(h.ctx.drawImage).toHaveBeenCalledTimes(2);
		handle.stop();
	});

	it('works without a microphone (static mouth)', async () => {
		const h = harness({openMicrophone: vi.fn(async () => null)});
		const handle = await startPersonaCamera({
			personaKey: 'provider-jordan-ellis',
			background: {kind: 'none'},
			reducedMotion: false,
			deps: h.deps,
		});
		await Promise.resolve();
		h.tick();
		expect(h.ctx.ellipse).not.toHaveBeenCalled();
		handle.stop();
	});

	it('rejects when canvas capture is unsupported so the caller can fall back', async () => {
		const h = harness();
		(h.canvas as unknown as {captureStream?: unknown}).captureStream = undefined;
		await expect(
			startPersonaCamera({personaKey: 'provider-jordan-ellis', background: {kind: 'none'}, reducedMotion: false, deps: h.deps}),
		).rejects.toThrow(/not supported/);
	});

	it('rejects when the art cannot load', async () => {
		const h = harness({loadImage: vi.fn(async () => Promise.reject(new Error('missing')))});
		await expect(
			startPersonaCamera({personaKey: 'provider-jordan-ellis', background: {kind: 'none'}, reducedMotion: false, deps: h.deps}),
		).rejects.toThrow('missing');
	});

	it('draws a built-in background image and keeps going when it is missing', async () => {
		const loadImage = vi.fn(async (src: string) => {
			if (src.includes('backgrounds')) {
				throw new Error('missing');
			}
			return {width: 760, height: 428} as never;
		});
		const h = harness({loadImage});
		const handle = await startPersonaCamera({
			personaKey: 'provider-jordan-ellis',
			background: {kind: 'image', imageId: 'nurse-station'},
			reducedMotion: false,
			deps: h.deps,
		});
		expect(loadImage).toHaveBeenCalledWith('/telehealth/backgrounds/nurse-station.jpg');
		expect(h.ctx.fillRect).toHaveBeenCalled();
		handle.stop();
	});
});
