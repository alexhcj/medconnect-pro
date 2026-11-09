import type {PrejoinPhase} from '@/lib/telehealth/prejoin-devices';

export type PrejoinCheckId = 'browser' | 'devices' | 'network';
export type PrejoinCheckState = 'checking' | 'pass' | 'fail' | 'deferred';

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

const DEVICE_CHECK_LABEL: Record<PrejoinPhase, string> = {
	checking: 'Checking camera and microphone…',
	ready: 'Camera and microphone allowed',
	blocked: 'Camera and microphone blocked',
	no_camera: 'No camera found · microphone ready',
};

const NETWORK_QUALITY_LABEL = {good: 'Good', fair: 'Fair', poor: 'Poor'} as const;

export function buildPrejoinChecks({browserSupported, phase, networkQuality}: BuildPrejoinChecksInput): PrejoinCheck[] {
	const devicesState: PrejoinCheckState =
		phase === 'checking' ? 'checking' : phase === 'ready' ? 'pass' : 'fail';

	const network: PrejoinCheck = networkQuality
		? {
				id: 'network',
				label: 'Network quality',
				state: networkQuality === 'poor' ? 'fail' : 'pass',
				detail: NETWORK_QUALITY_LABEL[networkQuality],
			}
		: {id: 'network', label: 'Network quality', state: 'deferred', detail: 'Checked after you join'};

	return [
		{
			id: 'browser',
			label: browserSupported ? 'Browser supported' : 'Browser not supported',
			state: browserSupported ? 'pass' : 'fail',
		},
		{id: 'devices', label: DEVICE_CHECK_LABEL[phase], state: devicesState},
		network,
	];
}
