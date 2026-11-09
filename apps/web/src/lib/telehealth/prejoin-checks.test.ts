import {describe, expect, it} from 'vitest';
import {buildPrejoinChecks} from '@/lib/telehealth/prejoin-checks';

describe('buildPrejoinChecks', () => {
	it('passes browser and devices when ready and defers the network row', () => {
		expect(buildPrejoinChecks({browserSupported: true, phase: 'ready'})).toEqual([
			{id: 'browser', label: 'Browser supported', state: 'pass'},
			{id: 'devices', label: 'Camera and microphone allowed', state: 'pass'},
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
		expect(poor).toMatchObject({state: 'fail', detail: 'Poor'});
	});

	it('maps each device phase to its row', () => {
		const row = (phase: Parameters<typeof buildPrejoinChecks>[0]['phase']) =>
			buildPrejoinChecks({browserSupported: true, phase})[1];
		expect(row('checking')).toMatchObject({state: 'checking', label: 'Checking camera and microphone…'});
		expect(row('blocked')).toMatchObject({state: 'fail', label: 'Camera and microphone blocked'});
		expect(row('no_camera')).toMatchObject({state: 'fail', label: 'No camera found · microphone ready'});
	});

	it('fails an unsupported browser', () => {
		expect(buildPrejoinChecks({browserSupported: false, phase: 'ready'})[0]).toEqual({
			id: 'browser',
			label: 'Browser not supported',
			state: 'fail',
		});
	});
});
