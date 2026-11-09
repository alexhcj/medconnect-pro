export const TEST_TONE_HZ = 523.25;
export const TEST_TONE_SECONDS = 0.9;

type SinkCapableContext = AudioContext & {setSinkId?: (sinkId: string) => Promise<void>};

export interface TestToneHandle {
	/** Resolves when the tone ends or is stopped. Never rejects. */
	done: Promise<void>;
	stop: () => void;
}

export interface TestToneOptions {
	/** The chosen speaker. Ignored where the browser cannot route an AudioContext (for example Safari). */
	outputDeviceId?: string;
	createContext?: () => SinkCapableContext;
}

function defaultContext(): SinkCapableContext {
	return new AudioContext() as SinkCapableContext;
}

/**
 * "Play test sound": a short, quiet tone made in the browser with the Web Audio API, so there is no
 * audio file to ship and nothing leaves the page.
 */
export function playTestTone({outputDeviceId, createContext = defaultContext}: TestToneOptions = {}): TestToneHandle {
	let context: SinkCapableContext | null = null;
	let oscillator: OscillatorNode | null = null;
	let finish: () => void = () => {};
	const done = new Promise<void>((resolve) => {
		finish = resolve;
	});

	const close = () => {
		const current = context;
		context = null;
		if (current && current.state !== 'closed') {
			void current.close().catch(() => undefined);
		}
		finish();
	};

	void (async () => {
		try {
			context = createContext();
			if (outputDeviceId && typeof context.setSinkId === 'function') {
				await context.setSinkId(outputDeviceId).catch(() => undefined);
			}
			if (!context) {
				return;
			}
			const gain = context.createGain();
			const now = context.currentTime;
			gain.gain.setValueAtTime(0.0001, now);
			gain.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
			gain.gain.exponentialRampToValueAtTime(0.0001, now + TEST_TONE_SECONDS);
			oscillator = context.createOscillator();
			oscillator.type = 'sine';
			oscillator.frequency.value = TEST_TONE_HZ;
			oscillator.connect(gain).connect(context.destination);
			oscillator.onended = close;
			oscillator.start(now);
			oscillator.stop(now + TEST_TONE_SECONDS);
		} catch {
			close();
		}
	})();

	return {
		done,
		stop: () => {
			try {
				oscillator?.stop();
			} catch {
				// Already stopped.
			}
			close();
		},
	};
}
