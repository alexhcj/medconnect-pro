import {describe, expect, it, vi} from 'vitest';
import {DAILY_API_BASE_URL, DailyRestAdapter} from './daily-rest-adapter.js';
import {dailyRoomNameForSession} from './daily-media-port.js';
import {DailyMediaUnavailableError} from './telehealth-session.errors.js';

const sessionId = '00000000-0000-4000-8000-0000000000cc';
const roomName = dailyRoomNameForSession(sessionId);
const roomUrl = `https://example.daily.co/${roomName}`;
const apiKey = 'test-daily-key';
const meetingToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake';

function jsonResponse(status: number, body: unknown): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	} as Response;
}

describe('DailyRestAdapter', () => {
	it('creates a private expiry-bounded room and mints a meeting token', async () => {
		const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
			if (String(url).endsWith('/rooms') && init?.method === 'POST') {
				return jsonResponse(200, {name: roomName, url: roomUrl});
			}
			if (String(url).endsWith('/meeting-tokens')) {
				return jsonResponse(200, {token: meetingToken});
			}
			throw new Error(`unexpected ${init?.method} ${url}`);
		});
		const adapter = new DailyRestAdapter(apiKey, fetchImpl as typeof fetch);
		const room = await adapter.createOrGetRoom({sessionId, expiresAtUnix: 1_800_000_000});
		expect(room).toEqual({roomName, roomUrl});

		const createCall = fetchImpl.mock.calls[0];
		expect(createCall[0]).toBe(`${DAILY_API_BASE_URL}/rooms`);
		expect(createCall[1]?.headers).toMatchObject({Authorization: `Bearer ${apiKey}`});
		expect(JSON.parse(String(createCall[1]?.body))).toEqual({
			name: roomName,
			privacy: 'private',
			properties: {
				exp: 1_800_000_000,
				eject_at_room_exp: true,
				enable_chat: false,
			},
		});

		const minted = await adapter.mintMeetingToken({
			roomName,
			userId: '00000000-0000-4000-8000-000000000012',
			expiresAtUnix: 1_800_000_000,
		});
		expect(minted.token).toBe(meetingToken);
		const tokenBody = JSON.parse(String(fetchImpl.mock.calls[1][1]?.body));
		expect(tokenBody.properties.user_id).toBe('00000000-0000-4000-8000-000000000012');
		expect(tokenBody.properties).not.toHaveProperty('user_name');
	});

	it('reuses a room when Daily reports the name already exists', async () => {
		const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
			if (init?.method === 'POST') {
				return jsonResponse(400, {
					error: 'invalid-request-error',
					info: `a room named '${roomName}' already exists`,
				});
			}
			if (init?.method === 'GET') {
				return jsonResponse(200, {name: roomName, url: roomUrl});
			}
			throw new Error(`unexpected ${init?.method} ${url}`);
		});
		const adapter = new DailyRestAdapter(apiKey, fetchImpl as typeof fetch);
		await expect(adapter.createOrGetRoom({sessionId, expiresAtUnix: 1_800_000_000})).resolves.toEqual({
			roomName,
			roomUrl,
		});
		expect(fetchImpl).toHaveBeenCalledTimes(2);
		expect(fetchImpl.mock.calls[1][0]).toBe(`${DAILY_API_BASE_URL}/rooms/${roomName}`);
	});

	it('deletes a room and treats 404 as already gone', async () => {
		const fetchImpl = vi
			.fn()
			.mockResolvedValueOnce(jsonResponse(200, {name: roomName}))
			.mockResolvedValueOnce(jsonResponse(404, {error: 'not-found'}));
		const adapter = new DailyRestAdapter(apiKey, fetchImpl as typeof fetch);
		await expect(adapter.deleteRoom(roomName)).resolves.toBeUndefined();
		await expect(adapter.deleteRoom(roomName)).resolves.toBeUndefined();
	});

	it('maps Daily failures to DailyMediaUnavailableError without leaking the key or token', async () => {
		const fetchImpl = vi.fn(async () => jsonResponse(500, {info: meetingToken}));
		const adapter = new DailyRestAdapter(apiKey, fetchImpl as typeof fetch);
		await expect(adapter.createOrGetRoom({sessionId, expiresAtUnix: 1})).rejects.toBeInstanceOf(
			DailyMediaUnavailableError,
		);
		try {
			await adapter.createOrGetRoom({sessionId, expiresAtUnix: 1});
		} catch (error) {
			const serialized = JSON.stringify(error);
			expect(serialized).not.toContain(apiKey);
			expect(serialized).not.toContain(meetingToken);
			expect((error as Error).message).not.toContain(apiKey);
		}
	});
});

