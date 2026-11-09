import type {PrejoinPhase} from '@/lib/telehealth/prejoin-devices';

export type PrejoinCheckId = 'browser' | 'camera' | 'microphone' | 'network';
/** `warn` is a device that is missing or blocked: the visit can still be joined, so it is not an error. */
export type PrejoinCheckState = 'checking' | 'pass' | 'warn' | 'fail' | 'deferred';

export interface PrejoinCheck {
	id: PrejoinCheckId;
	label: string;
	state: PrejoinCheckState;
	/** Right-aligned detail, for example "Checked after you join". */
	detail?: string;
}

export interface BuildPrejoinChecksInput {
	browserSupported: boolean;
	phase: PrejoinPhase;
	/**
	 * A real pre-join network result, only when the Daily pre-call test ran without a meeting token.
	 * `null` means no test ran: the row says so and never invents a result or a latency number.
	 */
	networkQuality?: 'good' | 'fair' | 'poor' | null;
}

const NETWORK_QUALITY_LABEL = {good: 'Good', fair: 'Fair', poor: 'Poor'} as const;

/** Per-device availability for a phase. `blocked` means camera and microphone are both unavailable. */
export function deviceAvailability(phase: PrejoinPhase): {camera: boolean; microphone: boolean} {
	return {
		camera: phase === 'ready',
		microphone: phase === 'ready' || phase === 'no_camera',
	};
}

export function buildPrejoinChecks({browserSupported, phase, networkQuality}: BuildPrejoinChecksInput): PrejoinCheck[] {
	const available = deviceAvailability(phase);
	const checking = phase === 'checking';
	const missingCamera = phase === 'no_camera' ? 'No camera found' : 'Camera blocked';

	const network: PrejoinCheck = networkQuality
		? {
				id: 'network',
				label: 'Network quality',
				state: networkQuality === 'poor' ? 'warn' : 'pass',
				detail: NETWORK_QUALITY_LABEL[networkQuality],
			}
		: {id: 'network', label: 'Network quality', state: 'deferred', detail: 'Checked after you join'};

	return [
		{
			id: 'browser',
			label: browserSupported ? 'Browser supported' : 'Browser not supported',
			state: browserSupported ? 'pass' : 'fail',
		},
		{
			id: 'camera',
			label: checking ? 'Checking camera…' : available.camera ? 'Camera allowed' : missingCamera,
			state: checking ? 'checking' : available.camera ? 'pass' : 'warn',
		},
		{
			id: 'microphone',
			label: checking ? 'Checking microphone…' : available.microphone ? 'Microphone allowed' : 'Microphone blocked',
			state: checking ? 'checking' : available.microphone ? 'pass' : 'warn',
		},
		network,
	];
}

export type ReadinessTone = 'checking' | 'success' | 'warning' | 'muted';

/**
 * The status next to the Join button. All devices working is success; one missing is a warning;
 * none working is muted (neutral): neither is an error because the visitor can still join.
 */
export function readinessTone(phase: PrejoinPhase): ReadinessTone {
	if (phase === 'checking') {
		return 'checking';
	}
	if (phase === 'ready') {
		return 'success';
	}
	return phase === 'no_camera' ? 'warning' : 'muted';
}
