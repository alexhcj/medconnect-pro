export type DailyCreateRoomInput = {
	sessionId: string;
	expiresAtUnix: number;
};

export type DailyRoom = {
	roomName: string;
	roomUrl: string;
};

export type DailyMintTokenInput = {
	roomName: string;
	userId: string;
	expiresAtUnix: number;
};

export type DailyMeetingToken = {
	token: string;
};

export interface DailyMediaPort {
	createOrGetRoom(input: DailyCreateRoomInput): Promise<DailyRoom>;
	mintMeetingToken(input: DailyMintTokenInput): Promise<DailyMeetingToken>;
	deleteRoom(roomName: string): Promise<void>;
}

export const DAILY_MEDIA_PORT = Symbol('DAILY_MEDIA_PORT');

export const DAILY_ROOM_NAME_PREFIX = 'mcp-';

export function dailyRoomNameForSession(sessionId: string): string {
	return `${DAILY_ROOM_NAME_PREFIX}${sessionId}`;
}
