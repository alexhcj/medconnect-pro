import Daily, {type DailyCall} from '@daily-co/daily-js';

export function createDailyCallObject(): DailyCall {
	return Daily.createCallObject();
}

/** Daily's own browser check, used by the green room's "Browser supported" row. */
export function isDailyBrowserSupported(): boolean {
	try {
		return Daily.supportedBrowser().supported;
	} catch {
		return false;
	}
}
