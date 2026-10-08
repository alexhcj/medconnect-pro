/** Mirrors Nest FakeDailyAdapter origin. Do not import from apps/api. */
export const UNCONFIGURED_DAILY_HOST = 'unconfigured.invalid';

export function isUnconfiguredDailyRoomUrl(roomUrl: string): boolean {
	try {
		return new URL(roomUrl).hostname === UNCONFIGURED_DAILY_HOST;
	} catch {
		return false;
	}
}
