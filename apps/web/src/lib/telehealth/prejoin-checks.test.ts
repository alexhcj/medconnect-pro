import {describe, expect, it} from 'vitest';
import {buildPrejoinChecks, readinessTone} from '@/lib/telehealth/prejoin-checks';

const rows = (phase: Parameters<typeof buildPrejoinChecks>[0]['phase']) =>
	Object.fromEntries(buildPrejoinChecks({browserSupported: true, phase}).map((check) => [check.id, check]));

describe('buildPrejoinChecks', () => {
	it('passes browser and both devices when ready and defers the network row', () => {
		expect(buildPrejoinChecks({browserSupported: true, phase: 'ready'})).toEqual([
			{id: 'browser', label: 'Browser supported', state: 'pass'},
			{id: 'camera', label: 'Camera allowed', state: 'pass'},
			{id: 'microphone', label: 'Microphone allowed', state: 'pass'},
			{id: 'network', label: 'Network quality', state: 'deferred', detail: 'Checked after you join'},
		]);
	});

	it('never invents a network result or a latency number', () => {
		const network = buildPrejoinChecks({browserSupported: true, phase: 'ready', networkQuality: null}).at(-1);
		expect(network?.detail).toBe('Checked after you join');
		expect(JSON.stringify(network)).not.toMatch(/\d+\s?ms/);
	});

	it('shows a real network result only when one was passed in', () => {
		const good = buildPrejoinChecks({browserSupported: true, phase: 'ready', networkQuality: 'good'}).at(-1);
		const poor = buildPrejoinChecks({browserSupported: true, phase: 'ready', networkQuality: 'poor'}).at(-1);
		expect(good).toMatchObject({state: 'pass', detail: 'Good'});
		expect(poor).toMatchObject({state: 'warn', detail: 'Poor'});
	});

	it('gives each device its own status, and a missing device is a warning, not an error', () => {
		expect(rows('no_camera').camera).toMatchObject({state: 'warn', label: 'No camera found'});
		expect(rows('no_camera').microphone).toMatchObject({state: 'pass', label: 'Microphone allowed'});
		expect(rows('blocked').camera).toMatchObject({state: 'warn', label: 'Camera blocked'});
		expect(rows('blocked').microphone).toMatchObject({state: 'warn', label: 'Microphone blocked'});
		expect(buildPrejoinChecks({browserSupported: true, phase: 'blocked'}).some((check) => check.state === 'fail')).toBe(
			false,
		);
	});

	it('shows both devices as checking while checking', () => {
		expect(rows('checking').camera).toMatchObject({state: 'checking', label: 'Checking camera…'});
		expect(rows('checking').microphone).toMatchObject({state: 'checking', label: 'Checking microphone…'});
	});

	it('fails an unsupported browser', () => {
		expect(buildPrejoinChecks({browserSupported: false, phase: 'ready'})[0]).toEqual({
			id: 'browser',
			label: 'Browser not supported',
			state: 'fail',
		});
	});
});

describe('readinessTone', () => {
	it('differs for all working, one missing and none working, and is never an error', () => {
		expect(readinessTone('ready')).toBe('success');
		expect(readinessTone('no_camera')).toBe('warning');
		expect(readinessTone('blocked')).toBe('muted');
		expect(readinessTone('checking')).toBe('checking');
	});
});
