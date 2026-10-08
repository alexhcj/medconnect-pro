import {describe, expect, it} from 'vitest';
import {dailyRoomNameForSession} from './daily-media-port.js';
import {FAKE_DAILY_ROOM_ORIGIN, FakeDailyAdapter} from './fake-daily-adapter.js';

const sessionId = '00000000-0000-4000-8000-0000000000cc';

describe('FakeDailyAdapter', () => {
	const adapter = new FakeDailyAdapter();

	it('returns a deterministic non-joinable room for a session', async () => {
		const room = await adapter.createOrGetRoom({sessionId, expiresAtUnix: 1_800_000_000});
		expect(room.roomName).toBe(dailyRoomNameForSession(sessionId));
		expect(room.roomUrl).toBe(`${FAKE_DAILY_ROOM_ORIGIN}/${room.roomName}`);
	});

	it('mints a placeholder token scoped to the room name', async () => {
		const room = await adapter.createOrGetRoom({sessionId, expiresAtUnix: 1_800_000_000});
		const minted = await adapter.mintMeetingToken({
			roomName: room.roomName,
			userId: '00000000-0000-4000-8000-000000000012',
			expiresAtUnix: 1_800_000_000,
		});
		expect(minted.token).toBe(`fake-meeting-token-${room.roomName}`);
	});

	it('treats delete as a no-op', async () => {
		await expect(adapter.deleteRoom(dailyRoomNameForSession(sessionId))).resolves.toBeUndefined();
	});
});
