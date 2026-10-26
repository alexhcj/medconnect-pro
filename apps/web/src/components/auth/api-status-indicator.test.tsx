import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@/lib/api/health-api', () => ({checkApiHealth: vi.fn()}));
vi.mock('@/lib/api/wake-ping', () => ({wakePing: vi.fn()}));

import {ApiStatusIndicator} from '@/components/auth/api-status-indicator';
import {ApiStatusProvider, useApiStatusContext} from '@/components/auth/api-status-provider';
import {checkApiHealth} from '@/lib/api/health-api';

const health = vi.mocked(checkApiHealth);
let awake = true;

/** Drives the shared status the way the login form does. */
function Controls() {
	const status = useApiStatusContext();
	return (
		<>
			<button onClick={status?.begin}>begin</button>
			<button onClick={status?.reportSubmitWake}>submit-woke</button>
			<button onClick={status?.markQueued}>queue</button>
		</>
	);
}

function renderIndicator(enabled = true) {
	return render(
		<ApiStatusProvider enabled={enabled}>
			<Controls />
			<ApiStatusIndicator />
		</ApiStatusProvider>,
	);
}

async function advance(ms: number) {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(ms);
	});
}

describe('ApiStatusIndicator', () => {
	beforeEach(() => {
		vi.useFakeTimers({shouldAdvanceTime: true});
		awake = true;
		health.mockReset();
		health.mockImplementation(async () => awake);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function user() {
		return userEvent.setup({advanceTimers: vi.advanceTimersByTime});
	}

	it('renders nothing when disabled (mock mode, PR preview)', () => {
		renderIndicator(false);
		expect(screen.queryByRole('button', {name: /api status/i})).not.toBeInTheDocument();
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});

	it('starts as a neutral dot with no card and no probing', async () => {
		renderIndicator();
		const dot = screen.getByRole('button', {name: 'API status'});
		expect(dot).toHaveAttribute('aria-expanded', 'false');
		await advance(30_000);
		expect(health).not.toHaveBeenCalled();
	});

	it('opens by itself while waking, with seconds and no percentage, and announces once', async () => {
		const u = user();
		awake = false;
		renderIndicator();
		await u.click(screen.getByRole('button', {name: 'begin'}));
		await advance(0);

		const trigger = screen.getByRole('button', {name: /waking up/i});
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		expect(trigger).toHaveAttribute('aria-controls', 'api-status-card');
		expect(screen.getByText(/usually about a minute/i)).toBeInTheDocument();
		expect(screen.getByText(/Elapsed \d+ s/)).toBeInTheDocument();
		expect(screen.queryByText(/%/)).not.toBeInTheDocument();

		const live = screen.getAllByRole('status');
		expect(live).toHaveLength(1);
		const announced = live[0].textContent;
		await advance(5000);
		expect(screen.getAllByRole('status')[0].textContent).toBe(announced);
	});

	it('toggles with Enter and Space and closes with Esc, returning focus to the trigger', async () => {
		const u = user();
		awake = false;
		renderIndicator();
		await u.click(screen.getByRole('button', {name: 'begin'}));
		await advance(0);

		const trigger = screen.getByRole('button', {name: /waking up/i});
		trigger.focus();
		await u.keyboard('{Enter}');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await u.keyboard(' ');
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await u.keyboard('{Escape}');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(trigger).toHaveFocus();
		expect(screen.queryByText(/usually about a minute/i)).not.toBeInTheDocument();
	});

	it('collapses to a green dot when ready, never polls it, and can be reopened', async () => {
		const u = user();
		renderIndicator();
		await u.click(screen.getByRole('button', {name: 'begin'}));
		await advance(0);

		const dot = screen.getByRole('button', {name: 'API status: API ready'});
		expect(dot).toHaveAttribute('aria-expanded', 'false');
		expect(health).toHaveBeenCalledTimes(1);
		await advance(120_000);
		expect(health).toHaveBeenCalledTimes(1);

		await u.click(dot);
		expect(dot).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByText('The API is awake. Free tier sleeps again when idle.')).toBeInTheDocument();
	});

	it('goes unreachable after the cap with a Retry that restarts the check', async () => {
		const u = user();
		awake = false;
		renderIndicator();
		await u.click(screen.getByRole('button', {name: 'begin'}));
		await advance(95_000);

		expect(screen.getByRole('button', {name: /api unreachable/i})).toHaveAttribute('aria-expanded', 'true');
		const retry = screen.getByRole('button', {name: 'Retry'});
		awake = true;
		await u.click(retry);
		await advance(50);
		expect(screen.getByRole('button', {name: 'API status: API ready'})).toBeInTheDocument();
	});

	it('flags a queued submit with an attention ring, then settles', async () => {
		const u = user();
		awake = false;
		renderIndicator();
		await u.click(screen.getByRole('button', {name: 'begin'}));
		await advance(0);
		const trigger = screen.getByRole('button', {name: /waking up/i});
		expect(trigger).not.toHaveClass('api-status-attention');

		await u.click(screen.getByRole('button', {name: 'queue'}));
		expect(trigger).toHaveClass('api-status-attention');
		await advance(3000);
		expect(trigger).not.toHaveClass('api-status-attention');
	});

	it('reopens as waking when a submit finds the API asleep again', async () => {
		const u = user();
		renderIndicator();
		await u.click(screen.getByRole('button', {name: 'begin'}));
		await advance(0);
		awake = false;
		await u.click(screen.getByRole('button', {name: 'submit-woke'}));
		await advance(0);
		expect(screen.getByRole('button', {name: /waking up/i})).toHaveAttribute('aria-expanded', 'true');
	});
});
