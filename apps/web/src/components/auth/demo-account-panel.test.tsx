import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DemoAccountPanel} from '@/components/auth/demo-account-panel';

const LIVE_ACCOUNTS = [
	{label: 'Practice admin', email: 'practice.admin@example.test', password: 'Demo-Admin-1'},
	{label: 'Provider', email: 'jordan.ellis@synthetic.example', password: 'Demo-Provider-1'},
	{label: 'MFA nurse', email: 'mfa.nurse@example.test', password: 'Demo-Mfa-1'},
	{label: 'Patient', email: 'avery.quinn@synthetic.example', password: 'Demo-Patient-1'},
] as const;

function setupUser() {
	const user = userEvent.setup();
	const writeText = vi.spyOn(navigator.clipboard, 'writeText');
	return {user, writeText};
}

describe('DemoAccountPanel', () => {

	it('shows four role-labeled accounts and the MFA code as instructions', () => {
		render(<DemoAccountPanel />);

		for (const account of LIVE_ACCOUNTS) {
			expect(screen.getByText(account.label)).toBeInTheDocument();
			expect(screen.getByText(account.email)).toBeInTheDocument();
			expect(screen.getByText(account.password)).toBeInTheDocument();
			expect(screen.getByRole('button', {name: `Copy email for ${account.label}`})).toBeEnabled();
			expect(screen.getByRole('button', {name: `Copy password for ${account.label}`})).toBeEnabled();
		}

		expect(screen.queryByText('provider@example.test')).toBeNull();
		expect(screen.queryByText('nurse@example.test')).toBeNull();
		expect(screen.getByText(/MFA nurse code:/)).toHaveTextContent('135790');
		expect(screen.queryByRole('textbox')).toBeNull();
	});

	it('copies email and password by click without moving focus', async () => {
		const {user, writeText} = setupUser();
		render(<DemoAccountPanel />);

		const emailButton = screen.getByRole('button', {name: 'Copy email for Practice admin'});
		await user.click(emailButton);

		expect(document.activeElement).toBe(emailButton);
		expect(writeText).toHaveBeenCalledWith('practice.admin@example.test');
		expect(await screen.findByText('Email copied')).toBeInTheDocument();

		const passwordButton = screen.getByRole('button', {name: 'Copy password for Patient'});
		await user.click(passwordButton);

		expect(document.activeElement).toBe(passwordButton);
		expect(writeText).toHaveBeenCalledWith('Demo-Patient-1');
		expect(await screen.findByText('Password copied')).toBeInTheDocument();
	});

	it('copies every account from the keyboard and keeps focus on the control', async () => {
		const {user, writeText} = setupUser();
		render(<DemoAccountPanel />);

		for (const account of LIVE_ACCOUNTS) {
			const emailButton = screen.getByRole('button', {name: `Copy email for ${account.label}`});
			emailButton.focus();
			await user.keyboard('{Enter}');
			expect(document.activeElement).toBe(emailButton);
			expect(writeText).toHaveBeenCalledWith(account.email);
			expect(await screen.findByText('Email copied')).toBeInTheDocument();

			const passwordButton = screen.getByRole('button', {name: `Copy password for ${account.label}`});
			passwordButton.focus();
			await user.keyboard(' ');
			expect(document.activeElement).toBe(passwordButton);
			expect(writeText).toHaveBeenCalledWith(account.password);
			expect(await screen.findByText('Password copied')).toBeInTheDocument();
		}
	});

	it('leaves credentials readable when the clipboard rejects the copy', async () => {
		const {user, writeText} = setupUser();
		writeText.mockRejectedValue(new Error('denied'));
		render(<DemoAccountPanel />);

		await user.click(screen.getByRole('button', {name: 'Copy email for Patient'}));

		await vi.waitFor(() => {
			expect(writeText).toHaveBeenCalledWith('avery.quinn@synthetic.example');
		});
		expect(screen.getByText('avery.quinn@synthetic.example')).toBeInTheDocument();
		expect(screen.getByText('Demo-Patient-1')).toBeInTheDocument();
		expect(screen.queryByText('Email copied')).toBeNull();
		expect(screen.queryByText('Password copied')).toBeNull();
	});
});
