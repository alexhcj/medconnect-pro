import {
	resetWakePingForTests,
	WAKE_PING_STORAGE_KEY,
	WAKE_PING_WINDOW_MS,
	wakePing,
	wakePingOnSignInGesture,
} from '@/lib/marketing/wake-ping';

function gesture(target: Element, isTrusted: boolean): Event {
	return {isTrusted, target} as unknown as Event;
}

function link(href: string): HTMLAnchorElement {
	const anchor = document.createElement('a');
	anchor.setAttribute('href', href);
	const label = document.createElement('span');
	anchor.appendChild(label);
	document.body.appendChild(anchor);
	return anchor;
}

describe('marketing wake ping', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-10-25T10:00:00Z'));
		vi.stubEnv('NEXT_PUBLIC_API_ORIGIN', 'https://api.example.test');
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}));
		resetWakePingForTests();
		window.localStorage.clear();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
		document.body.innerHTML = '';
		Object.defineProperty(navigator, 'webdriver', {value: false, configurable: true});
	});

	it('sends one cookieless no-cors GET /health to the API origin', () => {
		expect(wakePing()).toBe(true);
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(fetch).toHaveBeenCalledWith(
			'https://api.example.test/health',
			expect.objectContaining({
				method: 'GET',
				mode: 'no-cors',
				credentials: 'omit',
				keepalive: true,
			}),
		);
	});

	it('sends nothing without an API origin', () => {
		vi.stubEnv('NEXT_PUBLIC_API_ORIGIN', '');
		expect(wakePing()).toBe(false);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('dedupes within 60 s, across tabs through localStorage, then fires again', () => {
		expect(wakePing()).toBe(true);
		expect(wakePing()).toBe(false);
		resetWakePingForTests();
		expect(wakePing()).toBe(false);
		vi.advanceTimersByTime(WAKE_PING_WINDOW_MS + 1);
		resetWakePingForTests();
		expect(window.localStorage.getItem(WAKE_PING_STORAGE_KEY)).not.toBeNull();
		expect(wakePing()).toBe(true);
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('sends nothing for an automated browser or a PR preview', () => {
		Object.defineProperty(navigator, 'webdriver', {value: true, configurable: true});
		expect(wakePing()).toBe(false);
		Object.defineProperty(navigator, 'webdriver', {value: false, configurable: true});
		vi.stubEnv('NEXT_PUBLIC_DEPLOY_CONTEXT', 'pr-preview');
		expect(wakePing()).toBe(false);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('pings on a trusted gesture on a sign-in link, including a child element', () => {
		const anchor = link('http://localhost:3000/login');
		expect(wakePingOnSignInGesture(gesture(anchor.firstElementChild as Element, true))).toBe(true);
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('ignores untrusted events and other links', () => {
		const signIn = link('http://localhost:3000/login');
		const other = link('/platform/');
		expect(wakePingOnSignInGesture(gesture(signIn, false))).toBe(false);
		expect(wakePingOnSignInGesture(gesture(other, true))).toBe(false);
		expect(wakePingOnSignInGesture(gesture(document.body, true))).toBe(false);
		expect(fetch).not.toHaveBeenCalled();
	});
});
