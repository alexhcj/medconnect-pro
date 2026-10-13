const HOP_BY_HOP = new Set([
	'host',
	'connection',
	'keep-alive',
	'transfer-encoding',
	'content-length',
	'te',
	'trailer',
	'upgrade',
	'x-forwarded-for',
	'x-forwarded-host',
	'x-forwarded-proto',
	'x-forwarded-port',
]);

export type McpProxyResult = {
	status: number;
	body: ArrayBuffer | null;
	headers: Headers;
};

function browserAddress(headers: Headers): string | undefined {
	const forwarded = headers.get('x-forwarded-for');
	if (!forwarded) {
		return undefined;
	}
	const parts = forwarded
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
	return parts.at(-1);
}

function setCookies(headers: Headers): string[] {
	if (typeof headers.getSetCookie === 'function') {
		return headers.getSetCookie();
	}
	const single = headers.get('set-cookie');
	return single ? [single] : [];
}

export function upstreamApiUrl(
	apiBaseUrl: string,
	pathSegments: readonly string[],
	search: string,
): URL {
	const base = apiBaseUrl.trim().replace(/\/$/, '');
	if (!base) {
		throw new Error('API_BASE_URL is required for the /mcp-api proxy');
	}
	const suffix = pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
	const url = new URL(suffix ? `${base}/${suffix}` : `${base}/`);
	url.search = search;
	return url;
}

export async function proxyMcpApiRequest(input: {
	method: string;
	search: string;
	pathSegments: readonly string[];
	headers: Headers;
	body: ArrayBuffer | undefined;
	apiBaseUrl: string;
	fetchImpl?: typeof fetch;
}): Promise<McpProxyResult> {
	const target = upstreamApiUrl(input.apiBaseUrl, input.pathSegments, input.search);
	const headers = new Headers();
	input.headers.forEach((value, key) => {
		if (!HOP_BY_HOP.has(key.toLowerCase())) {
			headers.set(key, value);
		}
	});
	const clientIp = browserAddress(input.headers);
	if (clientIp) {
		headers.set('x-forwarded-for', clientIp);
	}

	const method = input.method.toUpperCase();
	const sendBody = method !== 'GET' && method !== 'HEAD';
	const upstream = await (input.fetchImpl ?? fetch)(target, {
		method,
		headers,
		body: sendBody ? input.body : undefined,
		redirect: 'manual',
	});

	const responseHeaders = new Headers();
	upstream.headers.forEach((value, key) => {
		const name = key.toLowerCase();
		if (name === 'set-cookie' || HOP_BY_HOP.has(name)) {
			return;
		}
		responseHeaders.set(key, value);
	});
	for (const cookie of setCookies(upstream.headers)) {
		responseHeaders.append('set-cookie', cookie);
	}

	const body =
		upstream.status === 204 || upstream.status === 304 ? null : await upstream.arrayBuffer();
	return {status: upstream.status, body, headers: responseHeaders};
}
