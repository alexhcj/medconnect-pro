import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {WaitingRoom} from '@/components/telehealth/waiting-room';

describe('WaitingRoom', () => {
	it('joins without requiring a device check in mock mode', async () => {
		const onJoin = vi.fn();
		const user = userEvent.setup();
		render(<WaitingRoom onJoin={onJoin} isJoining={false} />);

		expect(screen.getByText('Camera and microphone are ready.')).toBeInTheDocument();
		await user.click(screen.getByRole('button', {name: 'Join session'}));
		expect(onJoin).toHaveBeenCalledOnce();
	});

	it('announces a join error', () => {
		render(
			<WaitingRoom onJoin={vi.fn()} isJoining={false} errorMessage="Too many attempts. Try again later." />,
		);

		expect(screen.getByRole('alert')).toHaveTextContent('Too many attempts. Try again later.');
	});
});
