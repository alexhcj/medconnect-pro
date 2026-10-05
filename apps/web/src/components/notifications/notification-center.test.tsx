import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {NotificationCenter} from '@/components/notifications/notification-center';
import type {InboxNotification, NotificationPreference} from '@/types/notifications/inbox';

const {
	useNotificationInbox,
	useMarkNotificationRead,
	useNotificationPreferences,
	useUpdateNotificationPreferences,
} = vi.hoisted(() => ({
	useNotificationInbox: vi.fn(),
	useMarkNotificationRead: vi.fn(),
	useNotificationPreferences: vi.fn(),
	useUpdateNotificationPreferences: vi.fn(),
}));

vi.mock('@/lib/hooks/use-notifications', () => ({
	useNotificationInbox,
	useMarkNotificationRead,
	useNotificationPreferences,
	useUpdateNotificationPreferences,
}));

const unread: InboxNotification = {
	id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
	type: 'generic',
	title: 'Seeded inbox: census reminder',
	body: 'Harbor Synthetic Practice has new demo patients ready for the overview cards.',
	readAt: null,
	createdAt: '2026-10-05T16:00:00.000Z',
};

const providerOnly: InboxNotification = {
	id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
	type: 'generic',
	title: "Seeded inbox: today's visits",
	body: 'A live telehealth window and a same-day office visit are on your schedule.',
	readAt: null,
	createdAt: '2026-10-05T15:00:00.000Z',
};

const readItem: InboxNotification = {
	id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
	type: 'appointment_changed',
	title: 'Appointment scheduled',
	body: 'A visit was added to your schedule.',
	readAt: '2026-10-04T12:00:00.000Z',
	createdAt: '2026-10-04T12:00:00.000Z',
};

const defaultPreferences: NotificationPreference = {
	inAppEnabled: true,
	emailEnabled: true,
	smsEnabled: true,
};

function mockInbox(overrides: Record<string, unknown> = {}) {
	useNotificationInbox.mockReturnValue({
		data: [unread, readItem],
		isPending: false,
		isError: false,
		isSuccess: true,
		refetch: vi.fn(),
		...overrides,
	});
}

function mockPreferences(overrides: Record<string, unknown> = {}) {
	useNotificationPreferences.mockReturnValue({
		data: defaultPreferences,
		isPending: false,
		isError: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('NotificationCenter', () => {
	const markRead = vi.fn();
	const updatePreferences = vi.fn();

	beforeEach(() => {
		markRead.mockReset();
		updatePreferences.mockReset();
		mockInbox();
		mockPreferences();
		useMarkNotificationRead.mockReturnValue({
			mutate: markRead,
			isPending: false,
		});
		useUpdateNotificationPreferences.mockReturnValue({
			mutate: updatePreferences,
			isPending: false,
			isError: false,
			isSuccess: false,
			variables: undefined,
		});
	});

	it('names the Bell with an unread count and opens the inbox', async () => {
		const user = userEvent.setup();
		render(<NotificationCenter />);

		const bell = screen.getByRole('button', {name: 'Notifications, 1 unread'});
		expect(bell).toBeInTheDocument();
		await user.click(bell);

		expect(await screen.findByRole('dialog')).toBeInTheDocument();
		expect(screen.getByRole('heading', {name: 'Notifications'})).toBeInTheDocument();
		expect(screen.getByRole('list', {name: 'Notifications'})).toBeInTheDocument();
		expect(screen.getByText('Seeded inbox: census reminder')).toBeInTheDocument();
		expect(screen.getByText('Unread')).toBeInTheDocument();
		expect(screen.getByText('Read')).toBeInTheDocument();
		expect(screen.getByText('General')).toBeInTheDocument();
		expect(screen.getByText('Appointment')).toBeInTheDocument();
		expect(screen.queryByText("Seeded inbox: today's visits")).not.toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Mark as read'})).toBeInTheDocument();
	});

	it('does not invent a badge while the inbox is loading', () => {
		mockInbox({data: undefined, isPending: true, isSuccess: false, isError: false});
		render(<NotificationCenter />);

		expect(screen.getByRole('button', {name: 'Notifications'})).toBeInTheDocument();
	});

	it('shows loading, empty, and error inbox states', async () => {
		const user = userEvent.setup();
		const refetch = vi.fn();
		mockInbox({data: undefined, isPending: true, isSuccess: false, isError: false, refetch});
		const {rerender} = render(<NotificationCenter />);
		await user.click(screen.getByRole('button', {name: 'Notifications'}));
		expect(await screen.findByLabelText('Loading notifications')).toBeInTheDocument();

		mockInbox({data: [], isPending: false, isSuccess: true, isError: false, refetch});
		rerender(<NotificationCenter />);
		expect(screen.getByText('No notifications.')).toBeInTheDocument();
		expect(screen.getByText('Channel preferences remain available.')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Preferences'})).toBeInTheDocument();

		mockInbox({data: undefined, isPending: false, isSuccess: false, isError: true, refetch});
		rerender(<NotificationCenter />);
		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load notifications.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));
		expect(refetch).toHaveBeenCalled();
		expect(screen.getByRole('button', {name: 'Preferences'})).toBeInTheDocument();
	});

	it('marks an unread item read without putting title or body in the live region', async () => {
		const user = userEvent.setup();
		markRead.mockImplementation((_id: string, options?: {onSuccess?: () => void}) => {
			options?.onSuccess?.();
		});
		render(<NotificationCenter />);
		await user.click(screen.getByRole('button', {name: 'Notifications, 1 unread'}));
		await user.click(await screen.findByRole('button', {name: 'Mark as read'}));

		expect(markRead).toHaveBeenCalledWith(unread.id, expect.any(Object));
		const live = document.querySelector('[aria-live="polite"]');
		expect(live).toHaveTextContent('Notification marked as read');
		expect(live).not.toHaveTextContent(unread.title);
		expect(live).not.toHaveTextContent(unread.body);
	});

	it('opens preferences on the same surface and patches a channel', async () => {
		const user = userEvent.setup();
		render(<NotificationCenter />);
		await user.click(screen.getByRole('button', {name: 'Notifications, 1 unread'}));
		await user.click(await screen.findByRole('button', {name: 'Preferences'}));

		expect(screen.getByRole('heading', {name: 'Preferences'})).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Back to inbox'})).toBeInTheDocument();
		expect(
			screen.getByText('Saves a preference only. Email is a demo adapter, not a live carrier.'),
		).toBeInTheDocument();
		expect(screen.getByText(/Not push/)).toBeInTheDocument();

		await user.click(screen.getByRole('switch', {name: 'Email'}));
		expect(updatePreferences).toHaveBeenCalledWith({emailEnabled: false});
	});

	it('shows a preference save error with retry and keeps the last server value', async () => {
		const user = userEvent.setup();
		useUpdateNotificationPreferences.mockReturnValue({
			mutate: updatePreferences,
			isPending: false,
			isError: true,
			isSuccess: false,
			variables: {emailEnabled: false},
		});
		render(<NotificationCenter />);
		await user.click(screen.getByRole('button', {name: 'Notifications, 1 unread'}));
		await user.click(await screen.findByRole('button', {name: 'Preferences'}));

		expect(screen.getByRole('alert')).toHaveTextContent('Unable to save preferences.');
		expect(screen.getByRole('switch', {name: 'Email'})).toBeChecked();
		await user.click(screen.getByRole('button', {name: 'Retry'}));
		expect(updatePreferences).toHaveBeenCalledWith({emailEnabled: false});
	});

	it('closes the dialog and returns to the Bell', async () => {
		const user = userEvent.setup();
		render(<NotificationCenter />);
		const bell = screen.getByRole('button', {name: 'Notifications, 1 unread'});
		await user.click(bell);
		expect(await screen.findByRole('dialog')).toBeInTheDocument();
		await user.click(screen.getByRole('button', {name: 'Close notifications'}));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(bell).toHaveFocus();
	});

	it('never lists another user’s titles when they are absent from the session inbox', async () => {
		const user = userEvent.setup();
		mockInbox({data: [unread], isPending: false, isSuccess: true, isError: false});
		render(<NotificationCenter />);
		await user.click(screen.getByRole('button', {name: 'Notifications, 1 unread'}));
		expect(screen.getByText('Seeded inbox: census reminder')).toBeInTheDocument();
		expect(screen.queryByText(providerOnly.title)).not.toBeInTheDocument();
	});
});
