import {DailyMediaUnavailableError} from './telehealth-session.errors.js';
import {
	dailyRoomNameForSession,
	type DailyCreateRoomInput,
	type DailyMediaPort,
	type DailyMeetingToken,
	type DailyMintTokenInput,
	type DailyRoom,
} from './daily-media-port.js';

export const DAILY_API_BASE_URL = 'https://api.daily.co/v1';

export class DailyRestAdapter implements DailyMediaPort {
	constructor(
		private readonly apiKey: string,
		private readonly fetchImpl: typeof fetch = fetch,
	) {}

	async createOrGetRoom(input: DailyCreateRoomInput): Promise<DailyRoom> {
		const roomName = dailyRoomNameForSession(input.sessionId);
		const created = await this.requestJson('POST', '/rooms', {
			name: roomName,
			privacy: 'private',
			properties: {
				exp: input.expiresAtUnix,
				eject_at_room_exp: true,
				enable_chat: false,
			},
		});
		if (created.ok) {
			return this.toRoom(created.body, roomName);
		}
		if (isAlreadyExists(created.status, created.body)) {
			const existing = await this.requestJson(
				'GET',
				`/rooms/${encodeURIComponent(roomName)}`,
			);
			if (existing.ok) {
				return this.toRoom(existing.body, roomName);
			}
		}
		throw new DailyMediaUnavailableError();
	}

	async mintMeetingToken(input: DailyMintTokenInput): Promise<DailyMeetingToken> {
		const minted = await this.requestJson('POST', '/meeting-tokens', {
			properties: {
				room_name: input.roomName,
				exp: input.expiresAtUnix,
				user_id: input.userId,
			},
		});
		if (!minted.ok) {
			throw new DailyMediaUnavailableError();
		}
		const token = readString(minted.body, 'token');
		if (!token) {
			throw new DailyMediaUnavailableError();
		}
		return {token};
	}

	async deleteRoom(roomName: string): Promise<void> {
		const deleted = await this.requestJson(
			'DELETE',
			`/rooms/${encodeURIComponent(roomName)}`,
		);
		if (deleted.ok || deleted.status === 404) {
			return;
		}
		throw new DailyMediaUnavailableError();
	}

	private toRoom(body: unknown, fallbackName: string): DailyRoom {
		const roomName = readString(body, 'name') ?? fallbackName;
		const roomUrl = readString(body, 'url');
		if (!roomUrl) {
			throw new DailyMediaUnavailableError();
		}
		return {roomName, roomUrl};
	}

	private async requestJson(
		method: string,
		path: string,
		body?: Record<string, unknown>,
	): Promise<{ok: boolean; status: number; body: unknown}> {
		let response: Response;
		try {
			response = await this.fetchImpl(`${DAILY_API_BASE_URL}${path}`, {
				method,
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					Accept: 'application/json',
					...(body ? {'Content-Type': 'application/json'} : {}),
				},
				body: body ? JSON.stringify(body) : undefined,
			});
		} catch {
			throw new DailyMediaUnavailableError();
		}

		let parsed: unknown = undefined;
		try {
			parsed = await response.json();
		} catch {
			if (!response.ok && response.status !== 404) {
				throw new DailyMediaUnavailableError();
			}
		}
		return {ok: response.ok, status: response.status, body: parsed};
	}
}

function readString(body: unknown, key: string): string | undefined {
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return undefined;
	}
	const value = (body as Record<string, unknown>)[key];
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function isAlreadyExists(status: number, body: unknown): boolean {
	if (status !== 400 && status !== 409) {
		return false;
	}
	const info = body && typeof body === 'object' && !Array.isArray(body)
		? (body as Record<string, unknown>).info
		: undefined;
	return typeof info === 'string' && info.toLowerCase().includes('already exists');
}
