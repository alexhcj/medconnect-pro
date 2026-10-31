import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DemoAccountPanel} from '@/components/auth/demo-account-panel';

const LIVE_ACCOUNTS = [
	{label: 'Practice admin', email: 'practice.admin@example.test', password: 'Demo-Admin-1'},
	{label: 'Provider', email: 'jordan.ellis@synthetic.example', password: 'Demo-Provider-1'},
	{label: 'MFA nurse', email: 'mfa.nurse@example.test', password: 'Demo-Mfa-1'},
	{label: 'Patient', email: 'avery.quinn@synthetic.example', password: 'Demo-Patient-1'},
] as const;

const COPY_BLOCKED = 'Copy blocked. Select the text instead.';

function setupUser() {
	const user = userEvent.setup();
	const writeText = vi.spyOn(navigator.clipboard, 'writeText');
	return {user, writeText};
}

function renderPanel(props: Partial<Parameters<typeof DemoAccountPanel>[0]> = {}) {
	const onSelect = vi.fn();
	const view = render(<DemoAccountPanel onSelect={onSelect} {...props} />);
	return {onSelect, ...view};
}

describe('DemoAccountPanel', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('shows four 44 px role buttons, the MFA code and a Practice admin preview', () => {
		renderPanel();

		for (const account of LIVE_ACCOUNTS) {
			const button = screen.getByRole('button', {name: `Fill sign-in as ${account.label}`});
			expect(button).toBeEnabled();
			expect(button).toHaveAttribute('aria-pressed', 'false');
			expect(button).toHaveClass('min-h-11');
		}
		expect(screen.getByText(/MFA nurse code:/)).toHaveTextContent('135790');
		expect(screen.getByText('Preview: Practice admin. Tap a role to fill the sign-in form.')).toBeInTheDocument();
		expect(screen.getByText('practice.admin@example.test')).toHaveClass('select-all', 'break-all');
		expect(screen.getByText('Demo-Admin-1')).toHaveClass('select-all');
		expect(screen.getByRole('button', {name: 'Copy email for Practice admin'})).toHaveClass('w-9');
		expect(screen.queryByText('provider@example.test')).toBeNull();
		expect(screen.queryByText('nurse@example.test')).toBeNull();
		expect(screen.queryByRole('textbox')).toBeNull();
	});

	it('reports the tapped account and never fills by itself', async () => {
		const {user} = setupUser();
		const {onSelect} = renderPanel();

		await user.click(screen.getByRole('button', {name: 'Fill sign-in as Provider'}));

		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(onSelect).toHaveBeenCalledWith(LIVE_ACCOUNTS[1]);
	});

	it('marks the selected account and shows its credentials and status line', () => {
		renderPanel({selectedEmail: 'jordan.ellis@synthetic.example'});

		expect(screen.getByRole('button', {name: 'Fill sign-in as Provider'})).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('button', {name: 'Fill sign-in as Patient'})).toHaveAttribute('aria-pressed', 'false');
		expect(screen.getByText('Filled as Provider. Press Sign in.')).toBeInTheDocument();
		expect(screen.getByText('jordan.ellis@synthetic.example')).toBeInTheDocument();
		expect(screen.getByText('Demo-Provider-1')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Copy password for Provider'})).toBeInTheDocument();
	});

	it('disables the role buttons but keeps copy available', () => {
		renderPanel({disabled: true, selectedEmail: 'jordan.ellis@synthetic.example'});

		for (const account of LIVE_ACCOUNTS) {
			expect(screen.getByRole('button', {name: `Fill sign-in as ${account.label}`})).toBeDisabled();
		}
		expect(screen.getByRole('button', {name: 'Copy email for Provider'})).toBeEnabled();
	});

	it('shows a visible Copied state, announces it, keeps focus, then reverts', async () => {
		vi.useFakeTimers({shouldAdvanceTime: true});
		const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
		const writeText = vi.spyOn(navigator.clipboard, 'writeText');
		renderPanel({selectedEmail: 'avery.quinn@synthetic.example'});

		const emailButton = screen.getByRole('button', {name: 'Copy email for Patient'});
		await user.click(emailButton);

		expect(writeText).toHaveBeenCalledWith('avery.quinn@synthetic.example');
		expect(document.activeElement).toBe(emailButton);
		expect(await screen.findByText('Copied')).toBeVisible();
		expect(screen.getByText('Email copied')).toBeInTheDocument();

		await act(async () => {
			vi.advanceTimersByTime(2000);
		});
		expect(screen.queryByText('Copied')).toBeNull();
		expect(screen.queryByText('Email copied')).toBeNull();
	});

	it('copies the password from the keyboard without moving focus', async () => {
		const {user, writeText} = setupUser();
		renderPanel();

		const passwordButton = screen.getByRole('button', {name: 'Copy password for Practice admin'});
		passwordButton.focus();
		await user.keyboard(' ');

		expect(document.activeElement).toBe(passwordButton);
		expect(writeText).toHaveBeenCalledWith('Demo-Admin-1');
		expect(await screen.findByText('Password copied')).toBeInTheDocument();
	});

	it('shows the visible failure line when the clipboard rejects the copy', async () => {
		const {user, writeText} = setupUser();
		writeText.mockRejectedValue(new Error('denied'));
		renderPanel({selectedEmail: 'avery.quinn@synthetic.example'});

		await user.click(screen.getByRole('button', {name: 'Copy email for Patient'}));

		expect(await screen.findAllByText(COPY_BLOCKED)).toHaveLength(2);
		expect(screen.getByText('avery.quinn@synthetic.example')).toHaveClass('select-all', 'bg-brand-subtle');
		expect(screen.getByText('Demo-Patient-1')).toBeInTheDocument();
		expect(screen.queryByText('Copied')).toBeNull();
	});

	it('treats a missing clipboard API as a blocked copy', async () => {
		const user = userEvent.setup();
		const original = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
		Object.defineProperty(window.navigator, 'clipboard', {value: undefined, configurable: true});
		try {
			renderPanel();
			await user.click(screen.getByRole('button', {name: 'Copy password for Practice admin'}));

			expect(await screen.findAllByText(COPY_BLOCKED)).toHaveLength(2);
			expect(screen.getByText('Demo-Admin-1')).toHaveClass('bg-brand-subtle');
		} finally {
			if (original) {
				Object.defineProperty(window.navigator, 'clipboard', original);
			} else {
				delete (window.navigator as {clipboard?: unknown}).clipboard;
			}
		}
	});
});
