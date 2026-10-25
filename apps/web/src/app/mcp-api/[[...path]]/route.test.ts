import {afterEach, describe, expect, it, vi} from 'vitest';

vi.mock('@/lib/api/mcp-api-proxy', () => ({
	proxyMcpApiRequest: vi.fn(),
}));

import {proxyMcpApiRequest} from '@/lib/api/mcp-api-proxy';
import {GET} from './route';

const context = {params: Promise.resolve({path: ['health']})};

describe('/mcp-api route', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.mocked(proxyMcpApiRequest).mockReset();
	});

	it('answers 503 with an error envelope when the API is not configured', async () => {
		vi.stubEnv('API_BASE_URL', '');
		const response = await GET(new Request('http://localhost/mcp-api/health'), context);
		expect(response.status).toBe(503);
		await expect(response.json()).resolves.toMatchObject({error: {code: 'SERVICE_UNAVAILABLE'}});
	});

	it('answers a bare 502 when the upstream is unreachable (FE-049)', async () => {
		vi.stubEnv('API_BASE_URL', 'https://api.example.test');
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		vi.mocked(proxyMcpApiRequest).mockRejectedValue(new TypeError('fetch failed'));
		const response = await GET(new Request('http://localhost/mcp-api/health'), context);
		expect(response.status).toBe(502);
		expect(response.headers.get('x-mcp-proxy-error')).toBe('upstream-unreachable');
		expect(await response.text()).toBe('');
	});
});
