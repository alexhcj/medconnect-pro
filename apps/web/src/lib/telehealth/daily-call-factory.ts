import Daily, {type DailyCall} from '@daily-co/daily-js';

/**
 * Daily allows one call object per page. Destroying one is async, so a second object created right
 * after (React Strict Mode re-running an effect in dev, or the green room handing over to the real
 * join) throws "Duplicate DailyIframe instances are not allowed". Every destroy goes through
 * `destroyDailyCall`, and creators wait on `whenDailyCallsDestroyed` first.
 */
const pendingDestroys = new Set<Promise<void>>();

export function createDailyCallObject(): DailyCall {
	return Daily.createCallObject();
}

/** Destroys a call object and records the pending destroy. Never rejects. */
export function destroyDailyCall(call: DailyCall | null): Promise<void> {
	if (!call || call.isDestroyed()) {
		return Promise.resolve();
	}
	const pending: Promise<void> = call
		.destroy()
		.then(() => undefined)
		.catch(() => undefined)
		.finally(() => {
			pendingDestroys.delete(pending);
		});
	pendingDestroys.add(pending);
	return pending;
}

/** Resolves once every destroy started through `destroyDailyCall` has finished. */
export async function whenDailyCallsDestroyed(): Promise<void> {
	while (pendingDestroys.size > 0) {
		await Promise.all([...pendingDestroys]);
	}
	// A call object that was not created through this factory's destroy path still blocks a new one.
	const stale = Daily.getCallInstance();
	if (stale && !stale.isDestroyed()) {
		await destroyDailyCall(stale);
	}
}

/** Whether this browser can share a screen. Phones usually cannot; the control is hidden then (FE-063). */
export function canDailyShareScreen(): boolean {
	try {
		return Daily.supportedBrowser().supportsScreenShare !== false;
	} catch {
		return false;
	}
}

/** Daily's own browser check, used by the green room's "Browser supported" row. */
export function isDailyBrowserSupported(): boolean {
	try {
		return Daily.supportedBrowser().supported;
	} catch {
		return false;
	}
}
