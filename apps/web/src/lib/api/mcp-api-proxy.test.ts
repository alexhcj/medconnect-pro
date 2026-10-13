import {describe, expect, it, vi} from 'vitest';
import {proxyMcpApiRequest, upstreamApiUrl} from '@/lib/api/mcp-api-proxy';

describe('upstreamApiUrl', () => {
	it('joins the runtime API origin with the proxied path and query', () => {
		const url = upstreamApiUrl('https://api.example.test/', ['auth', 'login'], '?next=/dashboard');
		expect(url.toString()).toBe('https://api.example.test/auth/login?next=/dashboard');
	});
});

describe('proxyMcpApiRequest', () => {
	it('forwards status, body, cookies, and the CSRF header', async () => {
		const upstreamHeaders = new Headers();
		upstreamHeaders.append('content-type', 'application/json');
		upstreamHeaders.append('set-cookie', 'mcp_access=abc; Path=/mcp-api; HttpOnly');
		upstreamHeaders.append('set-cookie', 'mcp_csrf=tok; Path=/');
		const fetchImpl = vi.fn(async (_url: URL | string, _init?: RequestInit) => {
			return new Response(JSON.stringify({ok: true}), {status: 201, headers: upstreamHeaders});
		});

		const requestHeaders = new Headers();
		requestHeaders.set('cookie', 'mcp_access=abc');
		requestHeaders.set('x-csrf-token', 'tok');
		requestHeaders.set('content-type', 'application/json');
		requestHeaders.set('x-forwarded-for', '203.0.113.1, 198.51.100.8');
		requestHeaders.set('host', 'web.example.test');

		const result = await proxyMcpApiRequest({
			method: 'POST',
			search: '',
			pathSegments: ['auth', 'login'],
			headers: requestHeaders,
			body: new TextEncoder().encode('{"email":"a@synthetic.example"}').buffer,
			apiBaseUrl: 'https://api.example.test',
			fetchImpl: fetchImpl as typeof fetch,
		});

		expect(result.status).toBe(201);
		expect(JSON.parse(new TextDecoder().decode(result.body ?? new ArrayBuffer()))).toEqual({ok: true});
		expect(result.headers.get('content-type')).toContain('application/json');
		const cookies =
			typeof result.headers.getSetCookie === 'function'
				? result.headers.getSetCookie()
				: [result.headers.get('set-cookie') ?? ''];
		expect(cookies.some((cookie) => cookie.includes('mcp_access=abc'))).toBe(true);
		expect(cookies.some((cookie) => cookie.includes('mcp_csrf=tok'))).toBe(true);

		const init = fetchImpl.mock.calls[0]?.[1];
		expect(init).toBeDefined();
		const outbound = new Headers(init?.headers);
		expect(outbound.get('cookie')).toBe('mcp_access=abc');
		expect(outbound.get('x-csrf-token')).toBe('tok');
		expect(outbound.get('host')).toBeNull();
		expect(outbound.get('x-forwarded-for')).toBe('198.51.100.8');
		expect(init?.redirect).toBe('manual');
	});
});
