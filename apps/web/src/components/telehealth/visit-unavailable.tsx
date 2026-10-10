'use client';

import Link from 'next/link';

export function VisitUnavailable({
	title,
	message,
}: {
	title: string;
	message: string;
}) {
	return (
		<div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4" role="status">
			<h2 className="text-lg font-semibold text-gray-900">{title}</h2>
			<p className="text-sm text-gray-700">{message}</p>
			<Link
				href="/dashboard/telehealth"
				className="inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
			>
				Return to lobby
			</Link>
		</div>
	);
}
