import {describe, expect, it} from 'vitest';
import {deriveCallState, type CallStateInput} from '@/lib/telehealth/call-state';

const base: CallStateInput = {
	connectionState: 'connected',
	failureKind: 'none',
	hasRemote: true,
	hadRemote: true,
	deviceLost: false,
	networkLevel: 'good',
	cameraOn: true,
	leftAcknowledged: false,
	canEnd: false,
};

function derive(overrides: Partial<CallStateInput> = {}) {
	return deriveCallState({...base, ...overrides});
}

describe('deriveCallState', () => {
	it('shows nothing for a healthy call', () => {
		expect(derive()).toBeUndefined();
	});

	it('names who a provider is waiting for', () => {
		const state = derive({
			connectionState: 'waiting_for_participant',
			hasRemote: false,
			hadRemote: false,
			viewerRole: 'PROVIDER',
			patientName: 'Avery Quinn',
			providerName: 'Dr. Jordan Ellis',
		});
		expect(state).toMatchObject({state: 'waiting', text: 'Waiting for Avery Quinn to join…', actions: []});
	});

	it('tells a patient they are waiting for the provider', () => {
		const state = derive({
			connectionState: 'waiting_for_participant',
			hasRemote: false,
			hadRemote: false,
			viewerRole: 'PATIENT',
			patientName: 'Avery Quinn',
			providerName: 'Dr. Jordan Ellis',
		});
		expect(state?.text).toBe('Waiting for Dr. Jordan Ellis to join…');
	});

	it('falls back to the generic copy without a viewer role', () => {
		const state = derive({connectionState: 'waiting_for_participant', hasRemote: false, hadRemote: false});
		expect(state?.text).toBe('Waiting for the other participant');
	});

	it('offers Wait and, for the host only, End visit when a participant left', () => {
		const left = {connectionState: 'waiting_for_participant' as const, hasRemote: false, lastRemoteName: 'Avery Quinn'};
		const host = derive({...left, canEnd: true});
		expect(host).toMatchObject({state: 'participant_left', text: 'Avery Quinn left the call.', detail: 'The visit is still open.'});
		expect(host?.actions.map((action) => action.label)).toEqual(['Wait', 'End visit']);

		const guest = derive({...left, canEnd: false});
		expect(guest?.actions.map((action) => action.label)).toEqual(['Wait']);
	});

	it('returns to waiting after the viewer chooses Wait', () => {
		const state = derive({
			connectionState: 'waiting_for_participant',
			hasRemote: false,
			leftAcknowledged: true,
			canEnd: true,
		});
		expect(state?.state).toBe('waiting');
		expect(state?.actions).toEqual([]);
	});

	it('shows reconnecting without actions, ahead of presence', () => {
		expect(derive({connectionState: 'reconnecting', hasRemote: false})).toMatchObject({
			state: 'reconnecting',
			actions: [],
		});
	});

	it('offers a camera-off fallback only while the camera is on and the network is poor', () => {
		expect(derive({networkLevel: 'poor'})).toMatchObject({
			state: 'poor_network',
			actions: [{id: 'turn-off-camera', label: 'Turn off camera'}],
		});
		expect(derive({networkLevel: 'poor', cameraOn: false})).toBeUndefined();
		expect(derive({networkLevel: 'fair'})).toBeUndefined();
	});

	it('reports lost device access as an error with Retry devices', () => {
		expect(derive({deviceLost: true})).toMatchObject({
			kind: 'error',
			state: 'device_lost',
			actions: [{id: 'retry-devices', label: 'Retry devices'}],
		});
	});

	it('keeps the shipped not-configured copy and offers no retry', () => {
		const state = derive({connectionState: 'not_configured'});
		expect(state).toMatchObject({
			kind: 'error',
			text: 'Live media is not configured in this environment',
			detail: 'This demo environment does not have live Daily media configured.',
			actions: [],
		});
	});

	it('shows a failure with Retry and picks the copy by kind', () => {
		expect(derive({connectionState: 'failed', failureKind: 'permission'})).toMatchObject({
			kind: 'error',
			text: 'Camera or microphone access was denied. Allow access and retry.',
			actions: [{id: 'retry', label: 'Retry'}],
		});
		expect(derive({connectionState: 'failed'})?.text).toBe('Live media is currently unavailable.');
	});

	it('lets a failure win over lost devices', () => {
		expect(derive({connectionState: 'failed', deviceLost: true})?.state).toBe('failed');
	});
});
