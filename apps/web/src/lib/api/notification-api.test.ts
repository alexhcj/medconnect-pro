import {afterEach, describe, expect, it, vi} from 'vitest';
import {notificationRealAPI} from '@/lib/api/notification-api';
import type {NotificationPreferenceRdo, NotificationRdo} from '@/lib/api/notification-rdo';

const notificationRdo: NotificationRdo = {
	id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
	practiceId: '22222222-2222-4222-8222-222222222222',
	channel: 'in_app',
	type: 'generic',
	title: 'Seeded inbox: census reminder',
	body: 'Harbor Synthetic Practice has new demo patients ready for the overview cards.',
	status: 'delivered',
	readAt: null,
	createdAt: '2026-10-05T16:00:00.000Z',
	synthetic: true,
};

const preferenceRdo: NotificationPreferenceRdo = {
	practiceId: '22222222-2222-4222-8222-222222222222',
	userId: 'user_mock_practice_admin',
	inAppEnabled: true,
	emailEnabled: true,
	smsEnabled: true,
	synthetic: true,
};

function jsonResponse(body: unknown, status = 200) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	};
}

function expectCredentialedCookieFetch(call: unknown[] | undefined) {
	const init = call?.[1] as RequestInit | undefined;
	expect(init?.credentials).toBe('include');
	expect(new Headers(init?.headers).get('Authorization')).toBeNull();
}

describe('notificationRealAPI', () => {
	afterEach(() => {
		localStorage.removeItem('auth_token');
		vi.unstubAllGlobals();
	});

	it('lists the session inbox with cookies and unwraps NotificationListRdo', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({notifications: [notificationRdo]}));
		vi.stubGlobal('fetch', fetchMock);

		const inbox = await notificationRealAPI.listInbox();

		expect(inbox).toEqual([
			{
				id: notificationRdo.id,
				type: 'generic',
				title: notificationRdo.title,
				body: notificationRdo.body,
				readAt: null,
				createdAt: notificationRdo.createdAt,
			},
		]);
		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:3001/notifications',
			expect.any(Object),
		);
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('practiceId');
		expectCredentialedCookieFetch(fetchMock.mock.calls[0]);
	});

	it('marks a row read without sending practiceId', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const readRdo: NotificationRdo = {
			...notificationRdo,
			readAt: '2026-10-05T17:00:00.000Z',
		};
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(readRdo));
		vi.stubGlobal('fetch', fetchMock);

		const updated = await notificationRealAPI.markRead(notificationRdo.id);

		expect(updated.readAt).toBe(readRdo.readAt);
		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:3001/notifications/${notificationRdo.id}/read`,
			expect.objectContaining({method: 'PATCH'}),
		);
		expect(JSON.stringify(fetchMock.mock.calls[0]?.[1])).not.toContain('practiceId');
		expectCredentialedCookieFetch(fetchMock.mock.calls[0]);
	});

	it('loads and patches preferences without sending practiceId', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(jsonResponse(preferenceRdo))
			.mockResolvedValueOnce(jsonResponse({...preferenceRdo, emailEnabled: false}));
		vi.stubGlobal('fetch', fetchMock);

		await expect(notificationRealAPI.getPreferences()).resolves.toEqual({
			inAppEnabled: true,
			emailEnabled: true,
			smsEnabled: true,
		});
		expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3001/notifications/preferences');
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('practiceId');

		const updated = await notificationRealAPI.updatePreferences({emailEnabled: false});
		expect(updated.emailEnabled).toBe(false);
		expect(fetchMock.mock.calls[1]?.[0]).toBe('http://localhost:3001/notifications/preferences');
		expect(fetchMock.mock.calls[1]?.[1]).toEqual(
			expect.objectContaining({
				method: 'PATCH',
				body: JSON.stringify({emailEnabled: false}),
			}),
		);
		expect(String(fetchMock.mock.calls[1]?.[1]?.body)).not.toContain('practiceId');
		expectCredentialedCookieFetch(fetchMock.mock.calls[1]);
	});
});
