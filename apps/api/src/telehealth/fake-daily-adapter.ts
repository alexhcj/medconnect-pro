import {
	dailyRoomNameForSession,
	type DailyCreateRoomInput,
	type DailyMediaPort,
	type DailyMeetingToken,
	type DailyMintTokenInput,
	type DailyRoom,
} from './daily-media-port.js';

export const FAKE_DAILY_ROOM_ORIGIN = 'https://unconfigured.invalid';

export class FakeDailyAdapter implements DailyMediaPort {
	async createOrGetRoom(input: DailyCreateRoomInput): Promise<DailyRoom> {
		const roomName = dailyRoomNameForSession(input.sessionId);
		return {
			roomName,
			roomUrl: `${FAKE_DAILY_ROOM_ORIGIN}/${roomName}`,
		};
	}

	async mintMeetingToken(input: DailyMintTokenInput): Promise<DailyMeetingToken> {
		return {token: `fake-meeting-token-${input.roomName}`};
	}

	async deleteRoom(_roomName: string): Promise<void> {}
}
