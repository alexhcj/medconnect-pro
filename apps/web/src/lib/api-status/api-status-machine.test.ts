import {describe, expect, it} from 'vitest';
import {
	apiStatusAnnouncement,
	apiStatusReducer,
	initialApiStatusState,
	isProbing,
	UNREACHABLE_AFTER_SECONDS,
	type ApiStatusEvent,
	type ApiStatusState,
} from '@/lib/api-status/api-status-machine';

function run(events: ApiStatusEvent[], from: ApiStatusState = initialApiStatusState) {
	return events.reduce(apiStatusReducer, from);
}

describe('apiStatusReducer', () => {
	it('stays idle and collapsed until a begin', () => {
		expect(initialApiStatusState).toMatchObject({phase: 'idle', expanded: false});
		expect(apiStatusReducer(initialApiStatusState, {type: 'toggle'})).toBe(initialApiStatusState);
		expect(run([{type: 'begin'}])).toMatchObject({phase: 'checking', cycle: 1});
	});

	it('a begin is a no-op once started', () => {
		const state = run([{type: 'begin'}]);
		expect(apiStatusReducer(state, {type: 'begin'})).toBe(state);
	});

	it('goes straight to ready, collapsed, when the first probe answers', () => {
		const state = run([{type: 'begin'}, {type: 'healthOk'}]);
		expect(state).toMatchObject({phase: 'ready', expanded: false});
	});

	it('opens the card in waking when the first probe fails, and keeps probing', () => {
		const state = run([{type: 'begin'}, {type: 'healthFailed', now: 1000}]);
		expect(state).toMatchObject({phase: 'waking', expanded: true, wakingSince: 1000, cycle: 1});
		expect(run([{type: 'healthFailed', now: 5000}], state)).toBe(state);
		expect(isProbing(state.phase)).toBe(true);
	});

	it('counts elapsed seconds and reaches unreachable at the cap', () => {
		const waking = run([{type: 'begin'}, {type: 'healthFailed', now: 0}]);
		expect(run([{type: 'tick', now: 23_400}], waking).elapsedSeconds).toBe(23);
		const capped = run([{type: 'tick', now: UNREACHABLE_AFTER_SECONDS * 1000}], waking);
		expect(capped).toMatchObject({phase: 'unreachable', expanded: true});
		expect(isProbing(capped.phase)).toBe(false);
	});

	it('does not re-open a card the user closed on later ticks', () => {
		const state = run([
			{type: 'begin'},
			{type: 'healthFailed', now: 0},
			{type: 'close'},
			{type: 'tick', now: 4000},
		]);
		expect(state).toMatchObject({phase: 'waking', expanded: false, elapsedSeconds: 4});
	});

	it('collapses to ready when the API answers while waking', () => {
		const state = run([
			{type: 'begin'},
			{type: 'healthFailed', now: 0},
			{type: 'healthOk'},
		]);
		expect(state).toMatchObject({phase: 'ready', expanded: false, wakingSince: null});
	});

	it('lets the user reopen and close a ready dot, which never probes', () => {
		const ready = run([{type: 'begin'}, {type: 'healthOk'}]);
		const open = apiStatusReducer(ready, {type: 'toggle'});
		expect(open.expanded).toBe(true);
		expect(apiStatusReducer(open, {type: 'close'}).expanded).toBe(false);
		expect(isProbing(ready.phase)).toBe(false);
		expect(apiStatusReducer(ready, {type: 'healthFailed', now: 1})).toBe(ready);
	});

	it('retry restarts the cycle from unreachable only', () => {
		const unreachable = run([
			{type: 'begin'},
			{type: 'healthFailed', now: 0},
			{type: 'tick', now: 91_000},
		]);
		const retried = apiStatusReducer(unreachable, {type: 'retry', now: 100_000});
		expect(retried).toMatchObject({
			phase: 'waking',
			wakingSince: 100_000,
			elapsedSeconds: 0,
			cycle: unreachable.cycle + 1,
		});
		const ready = run([{type: 'begin'}, {type: 'healthOk'}]);
		expect(apiStatusReducer(ready, {type: 'retry', now: 1})).toBe(ready);
	});

	it('a failed submit restarts the cycle from ready, and is a no-op while waking', () => {
		const ready = run([{type: 'begin'}, {type: 'healthOk'}]);
		const woken = apiStatusReducer(ready, {type: 'submitWake', now: 7000});
		expect(woken).toMatchObject({phase: 'waking', expanded: true, cycle: ready.cycle + 1});
		expect(apiStatusReducer(woken, {type: 'submitWake', now: 8000})).toBe(woken);
	});

	it('a failed submit before any focus starts the cycle', () => {
		expect(run([{type: 'submitWake', now: 1}])).toMatchObject({phase: 'waking', cycle: 1});
	});

	it('a queued submit bumps the pulse counter', () => {
		expect(run([{type: 'queued'}, {type: 'queued'}]).pulse).toBe(2);
	});

	it('announces per phase and never the timer', () => {
		expect(apiStatusAnnouncement('idle')).toBe('');
		expect(apiStatusAnnouncement('waking')).not.toMatch(/\d/);
		expect(apiStatusAnnouncement('ready')).toBe('The API is ready.');
	});
});
