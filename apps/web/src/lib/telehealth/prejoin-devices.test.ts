import {describe, expect, it} from 'vitest';
import {
	classifyGetUserMediaError,
	phaseFromDailyCameraError,
	phaseFromMediaError,
	PREJOIN_READINESS_COPY,
	primaryJoinAction,
} from '@/lib/telehealth/prejoin-devices';

describe('classifyGetUserMediaError', () => {
	it('maps missing devices separately from permission denial', () => {
		expect(classifyGetUserMediaError({name: 'NotFoundError'})).toBe('no_device');
		expect(classifyGetUserMediaError({name: 'OverconstrainedError'})).toBe('no_device');
		expect(classifyGetUserMediaError({name: 'NotAllowedError'})).toBe('permission_denied');
		expect(classifyGetUserMediaError({name: 'NotReadableError'})).toBe('permission_denied');
	});
});

describe('green room phases', () => {
	it('maps media errors to blocked or no camera', () => {
		expect(phaseFromMediaError({name: 'NotAllowedError'})).toBe('blocked');
		expect(phaseFromMediaError({name: 'NotReadableError'})).toBe('blocked');
		expect(phaseFromMediaError({name: 'NotFoundError'})).toBe('no_camera');
		expect(phaseFromMediaError({name: 'OverconstrainedError'})).toBe('no_camera');
		expect(phaseFromMediaError(undefined)).toBe('blocked');
	});

	it('maps Daily camera errors', () => {
		expect(phaseFromDailyCameraError('permissions')).toBe('blocked');
		expect(phaseFromDailyCameraError('cam-in-use')).toBe('blocked');
		expect(phaseFromDailyCameraError('not-found', ['video'])).toBe('no_camera');
		expect(phaseFromDailyCameraError('not-found', ['audio'])).toBe('blocked');
		expect(phaseFromDailyCameraError('constraints')).toBe('no_camera');
		expect(phaseFromDailyCameraError(undefined)).toBe('blocked');
	});

	it('picks the join action from the phase', () => {
		expect(primaryJoinAction('ready')).toEqual({label: 'Join visit', audioOnly: false, disabled: false});
		expect(primaryJoinAction('checking')).toEqual({label: 'Join visit', audioOnly: false, disabled: true});
		expect(primaryJoinAction('blocked')).toEqual({label: 'Join with audio only', audioOnly: true, disabled: false});
		expect(primaryJoinAction('no_camera')).toEqual({label: 'Join with audio only', audioOnly: true, disabled: false});
	});

	it('has readiness text for every phase', () => {
		expect(PREJOIN_READINESS_COPY).toEqual({
			checking: 'Checking…',
			ready: 'Ready to join',
			blocked: 'Camera blocked',
			no_camera: 'No camera',
		});
	});
});
