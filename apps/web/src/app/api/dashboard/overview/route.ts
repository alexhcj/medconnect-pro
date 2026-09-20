import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';

export async function GET() {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get('accessToken')?.value;

		if (!accessToken) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401});
		}

		const apiBaseUrl = process.env.API_BASE_URL;
		if (!apiBaseUrl) {
			return NextResponse.json({error: 'Dashboard service unavailable'}, {status: 503});
		}

		const response = await fetch(`${apiBaseUrl}/dashboard/overview`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			return NextResponse.json(
				{error: 'Failed to load dashboard overview'},
				{status: response.status},
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error('Dashboard overview error:', error);
		return NextResponse.json({error: 'Internal server error'}, {status: 500});
	}
}
