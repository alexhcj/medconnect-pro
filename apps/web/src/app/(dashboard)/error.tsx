'use client';

import {useEffect} from 'react';
import {Button} from '@/components/ui/button';

export default function DashboardError({
	error,
	reset,
}: {
	error: Error & {digest?: string};
	reset: () => void;
}) {
	useEffect(() => {
		console.error('Dashboard route error', error.digest ?? error.message);
	}, [error]);

	return (
		<div className="rounded-lg border border-red-200 bg-white p-6">
			<h1 className="text-lg font-semibold text-gray-900">Unable to load this page</h1>
			<p className="mt-2 text-sm text-gray-600">
				Something went wrong. Your data was not changed. Try again, or return to the dashboard.
			</p>
			<div className="mt-4 flex flex-wrap gap-3">
				<Button type="button" onClick={() => reset()}>
					Try again
				</Button>
				<Button type="button" variant="outline" onClick={() => {
					window.location.href = '/dashboard';
				}}>
					Go to dashboard
				</Button>
			</div>
		</div>
	);
}
