import {NextResponse} from 'next/server';
import {proxyMcpApiRequest} from '@/lib/api/mcp-api-proxy';

export const dynamic = 'force-dynamic';

type RouteContext = {
	params: Promise<{path?: string[]}>;
};

async function handle(request: Request, context: RouteContext): Promise<NextResponse> {
	const apiBaseUrl = process.env.API_BASE_URL?.trim() ?? '';
	if (!apiBaseUrl) {
		return NextResponse.json(
			{error: {code: 'SERVICE_UNAVAILABLE', message: 'API proxy is not configured'}},
			{status: 503},
		);
	}

	const {path = []} = await context.params;
	const url = new URL(request.url);
	const method = request.method.toUpperCase();
	const body =
		method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();
	const result = await proxyMcpApiRequest({
		method,
		search: url.search,
		pathSegments: path,
		headers: request.headers,
		body,
		apiBaseUrl,
	});

	return new NextResponse(result.body, {
		status: result.status,
		headers: result.headers,
	});
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
