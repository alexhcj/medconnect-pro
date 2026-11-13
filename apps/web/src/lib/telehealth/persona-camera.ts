import {backgroundImageById, type BackgroundChoice} from '@/lib/telehealth/prejoin-backgrounds';
import {
	PERSONA_ART_HEIGHT,
	PERSONA_ART_WIDTH,
	personaFor,
	type DemoPersonaKey,
} from '@/lib/telehealth/demo-personas';

/**
 * Demo persona camera (FE-065, SEC-013 scope 9). An illustrated persona is drawn on a canvas and
 * captured as a video track that replaces the device camera in demo builds. It lives in the browser
 * only: nothing about it is sent to Nest or logged, and it is never applied to anyone else's video.
 */
export const PERSONA_FPS = 15;
export const PERSONA_CANVAS_WIDTH = 640;
export const PERSONA_CANVAS_HEIGHT = 360;
/** A tab hidden for this long stops drawing; it resumes when the tab is visible again. */
export const PERSONA_HIDDEN_PAUSE_MS = 10_000;

const FRAME_MS = Math.round(1000 / PERSONA_FPS);
const STILL_BACKGROUND = '#EBF1F4';

/** Gentle vertical sway and breathing scale. Nothing moves with reduced motion. */
export function idleTransform(seconds: number, reducedMotion: boolean): {dy: number; scale: number} {
	if (reducedMotion) {
		return {dy: 0, scale: 1};
	}
	return {dy: Math.sin(seconds * 1.3) * 2.5, scale: 1 + Math.sin(seconds * 0.9) * 0.004};
}

/** Mouth opening from 0 (closed, the drawn smile) to 1. Static with reduced motion or no mic level. */
export function mouthOpenness(level: number, reducedMotion: boolean): number {
	if (reducedMotion || !Number.isFinite(level) || level < 0.06) {
		return 0;
	}
	return Math.min(1, level * 1.6);
}

/** RMS level of a time-domain byte buffer, 0 to 1. */
export function levelFromTimeDomain(bytes: ArrayLike<number>): number {
	if (bytes.length === 0) {
		return 0;
	}
	let sum = 0;
	for (let index = 0; index < bytes.length; index += 1) {
		const centred = (bytes[index] - 128) / 128;
		sum += centred * centred;
	}
	return Math.min(1, Math.sqrt(sum / bytes.length) * 3);
}

export interface PersonaCameraOptions {
	personaKey: DemoPersonaKey;
	background: BackgroundChoice;
	microphoneId?: string;
	reducedMotion: boolean;
	/** Overrides for tests. */
	deps?: Partial<PersonaCameraDeps>;
}

export interface PersonaCameraDeps {
	createCanvas: () => HTMLCanvasElement;
	loadImage: (src: string) => Promise<CanvasImageSource & {width: number; height: number}>;
	openMicrophone: (deviceId?: string) => Promise<{read: () => number; close: () => void} | null>;
	now: () => number;
	setInterval: (handler: () => void, ms: number) => ReturnType<typeof setInterval>;
	clearInterval: (id: ReturnType<typeof setInterval>) => void;
	isHidden: () => boolean;
}

export interface PersonaCameraHandle {
	/** The video track sent to Daily as the custom video source. */
	track: MediaStreamTrack;
	/** The live stream, for the green room preview element. */
	stream: MediaStream;
	setBackground: (background: BackgroundChoice) => Promise<void>;
	setReducedMotion: (reduced: boolean) => void;
	stop: () => void;
}

function defaultLoadImage(src: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error('Persona image failed to load'));
		image.src = src;
	});
}

async function defaultOpenMicrophone(deviceId?: string) {
	const AudioContextCtor =
		typeof window === 'undefined'
			? undefined
			: (window.AudioContext ?? (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext);
	if (!AudioContextCtor || !navigator.mediaDevices?.getUserMedia) {
		return null;
	}
	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: deviceId ? {deviceId: {ideal: deviceId}} : true,
		});
		const context = new AudioContextCtor();
		const analyser = context.createAnalyser();
		analyser.fftSize = 512;
		context.createMediaStreamSource(stream).connect(analyser);
		const buffer = new Uint8Array(analyser.fftSize);
		return {
			read: () => {
				analyser.getByteTimeDomainData(buffer);
				return levelFromTimeDomain(buffer);
			},
			close: () => {
				stream.getTracks().forEach((track) => track.stop());
				void context.close().catch(() => undefined);
			},
		};
	} catch {
		// No microphone or permission refused: the persona still works with a static mouth.
		return null;
	}
}

function defaultDeps(): PersonaCameraDeps {
	return {
		createCanvas: () => document.createElement('canvas'),
		loadImage: defaultLoadImage,
		openMicrophone: defaultOpenMicrophone,
		now: () => performance.now(),
		setInterval: (handler, ms) => setInterval(handler, ms),
		clearInterval: (id) => clearInterval(id),
		isHidden: () => document.visibilityState === 'hidden',
	};
}

/**
 * Starts the persona camera. Rejects when the canvas, capture stream or art is unavailable, so the
 * caller can fall back to the real camera.
 */
export async function startPersonaCamera(options: PersonaCameraOptions): Promise<PersonaCameraHandle> {
	const deps: PersonaCameraDeps = {...defaultDeps(), ...options.deps};
	const persona = personaFor(options.personaKey);
	const canvas = deps.createCanvas();
	canvas.width = PERSONA_CANVAS_WIDTH;
	canvas.height = PERSONA_CANVAS_HEIGHT;
	const context = canvas.getContext('2d');
	if (!context || typeof canvas.captureStream !== 'function') {
		throw new Error('Persona camera is not supported in this browser');
	}
	const art = await deps.loadImage(persona.src);
	const stream = canvas.captureStream(PERSONA_FPS);
	const track = stream.getVideoTracks()[0];
	if (!track) {
		throw new Error('Persona camera produced no video track');
	}

	let background = options.background;
	let backgroundImage: (CanvasImageSource & {width: number; height: number}) | null = null;
	let reducedMotion = options.reducedMotion;
	let stopped = false;
	let hiddenSince: number | null = null;
	let mic: {read: () => number; close: () => void} | null = null;
	let level = 0;
	const startedAt = deps.now();

	async function loadBackground(choice: BackgroundChoice) {
		background = choice;
		backgroundImage = null;
		if (choice.kind === 'image') {
			try {
				backgroundImage = await deps.loadImage(backgroundImageById(choice.imageId).src);
			} catch {
				// Keep the plain background when the image is unavailable.
			}
		}
	}
	await loadBackground(options.background);
	void deps.openMicrophone(options.microphoneId).then((opened) => {
		if (stopped) {
			opened?.close();
			return;
		}
		mic = opened;
	});

	function drawBackground(ctx: CanvasRenderingContext2D) {
		const w = PERSONA_CANVAS_WIDTH;
		const h = PERSONA_CANVAS_HEIGHT;
		if (background.kind === 'image' && backgroundImage) {
			const scale = Math.max(w / backgroundImage.width, h / backgroundImage.height);
			const dw = backgroundImage.width * scale;
			const dh = backgroundImage.height * scale;
			ctx.drawImage(backgroundImage, (w - dw) / 2, (h - dh) / 2, dw, dh);
			return;
		}
		if (background.kind === 'blur') {
			const gradient = ctx.createLinearGradient(0, 0, w, h);
			gradient.addColorStop(0, '#CFE0E6');
			gradient.addColorStop(1, STILL_BACKGROUND);
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, w, h);
			return;
		}
		ctx.fillStyle = STILL_BACKGROUND;
		ctx.fillRect(0, 0, w, h);
	}

	function draw() {
		const ctx = context;
		if (!ctx || stopped) {
			return;
		}
		const seconds = (deps.now() - startedAt) / 1000;
		const {dy, scale: breathe} = idleTransform(seconds, reducedMotion);
		const fit = PERSONA_CANVAS_HEIGHT / PERSONA_ART_HEIGHT;
		const scale = fit * breathe;
		const drawW = PERSONA_ART_WIDTH * scale;
		const drawH = PERSONA_ART_HEIGHT * scale;
		const x = (PERSONA_CANVAS_WIDTH - drawW) / 2;
		const y = PERSONA_CANVAS_HEIGHT - drawH + dy;
		ctx.clearRect(0, 0, PERSONA_CANVAS_WIDTH, PERSONA_CANVAS_HEIGHT);
		drawBackground(ctx);
		ctx.drawImage(art, x, y, drawW, drawH);

		const measured = mic ? mic.read() : 0;
		level = level * 0.5 + measured * 0.5;
		const open = mouthOpenness(level, reducedMotion);
		if (open > 0) {
			ctx.fillStyle = '#5B2B2B';
			ctx.beginPath();
			ctx.ellipse(x + persona.mouth.x * scale, y + persona.mouth.y * scale, 11 * scale, (2 + open * 9) * scale, 0, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	draw();
	const timer = deps.setInterval(() => {
		if (deps.isHidden()) {
			hiddenSince ??= deps.now();
			if (deps.now() - hiddenSince >= PERSONA_HIDDEN_PAUSE_MS) {
				return;
			}
		} else {
			hiddenSince = null;
		}
		draw();
	}, FRAME_MS);

	return {
		track,
		stream,
		setBackground: loadBackground,
		setReducedMotion: (reduced) => {
			reducedMotion = reduced;
		},
		stop: () => {
			if (stopped) {
				return;
			}
			stopped = true;
			deps.clearInterval(timer);
			mic?.close();
			mic = null;
			track.stop();
		},
	};
}
