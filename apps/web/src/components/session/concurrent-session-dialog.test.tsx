import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ConcurrentSessionDialog} from '@/components/session/concurrent-session-dialog';
import type {ConcurrentSessionInfo} from '@/types/auth/session';

const harness = vi.hoisted(() => ({
	sessions: [] as ConcurrentSessionInfo[],
	isLoading: false,
	terminate: vi.fn(async () => undefined),
	logoutEverywhere: vi.fn(async () => undefined),
	isPending: false,
}));

vi.mock('@/lib/hooks/use-session', () => ({
	useConcurrentSessions: () => ({data: harness.sessions, isLoading: harness.isLoading}),
	useTerminateSessions: () => ({
		mutateAsync: harness.terminate,
		isPending: harness.isPending,
	}),
	useLogoutEverywhere: () => ({
		mutateAsync: harness.logoutEverywhere,
		isPending: harness.isPending,
	}),
}));

const now = Date.now();

function session(overrides: Partial<ConcurrentSessionInfo> = {}): ConcurrentSessionInfo {
	return {
		sessionId: 'current-session',
		device: 'This session',
		loginTime: now - 60_000,
		lastActivity: now - 60_000,
		isCurrentSession: true,
		...overrides,
	};
}

function livePair(): ConcurrentSessionInfo[] {
	return [
		session(),
		session({
			sessionId: 'other-session',
			device: 'Other session',
			isCurrentSession: false,
			lastActivity: now - 10 * 60 * 1000,
		}),
	];
}

describe('ConcurrentSessionDialog', () => {
	beforeEach(() => {
		harness.sessions = [];
		harness.isLoading = false;
		harness.isPending = false;
		harness.terminate.mockReset();
		harness.logoutEverywhere.mockReset();
		harness.terminate.mockResolvedValue(undefined);
		harness.logoutEverywhere.mockResolvedValue(undefined);
	});

	it('stays closed for a single session', () => {
		harness.sessions = [session()];
		render(<ConcurrentSessionDialog />);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('opens for live sessions without IP or location', async () => {
		harness.sessions = livePair();
		render(<ConcurrentSessionDialog />);

		const dialog = await screen.findByRole('dialog', {name: 'Multiple Sessions Detected'});
		expect(dialog).toHaveTextContent("You're signed in on more than one session");
		expect(dialog).not.toHaveTextContent('IP:');
		expect(dialog).not.toHaveTextContent('Amsterdam');
		expect(dialog).not.toHaveTextContent('Demo data');
		expect(screen.getByRole('checkbox', {name: /Terminate Other session, last active/})).toBeChecked();
	});

	it('continues here by revoking only the other session', async () => {
		harness.sessions = livePair();
		const user = userEvent.setup();
		render(<ConcurrentSessionDialog />);
		await screen.findByRole('dialog', {name: 'Multiple Sessions Detected'});

		await user.click(screen.getByRole('button', {name: 'Continue Here Only'}));

		expect(harness.terminate).toHaveBeenCalledWith(['other-session']);
		expect(harness.logoutEverywhere).not.toHaveBeenCalled();
	});

	it('logs out everywhere without revoking individual sessions', async () => {
		harness.sessions = livePair();
		const user = userEvent.setup();
		render(<ConcurrentSessionDialog />);
		await screen.findByRole('dialog', {name: 'Multiple Sessions Detected'});

		await user.click(screen.getByRole('button', {name: 'Log Out Everywhere'}));

		expect(harness.logoutEverywhere).toHaveBeenCalledOnce();
		expect(harness.terminate).not.toHaveBeenCalled();
	});

	it('labels mock location and IP as demo data', async () => {
		harness.sessions = [
			session({
				location: 'Amsterdam, Netherlands',
				browser: 'Chrome 120.0',
				ipAddress: '94.211.158.42',
			}),
			session({
				sessionId: 'other-session',
				device: 'Desktop',
				isCurrentSession: false,
				location: 'Rotterdam, Netherlands',
				browser: 'Firefox',
				ipAddress: '198.51.100.8',
			}),
		];
		render(<ConcurrentSessionDialog />);

		const dialog = await screen.findByRole('dialog', {name: 'Multiple Sessions Detected'});
		expect(dialog).toHaveTextContent('Demo data');
		expect(dialog).toHaveTextContent('Amsterdam, Netherlands');
		expect(dialog).toHaveTextContent('IP: 94.211.158.42');
	});
});
