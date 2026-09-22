import Link from 'next/link';
import {LOGIN_PATH} from '@/lib/auth/paths';

export function MilestoneStubPage({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
			<div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
				<h1 className="text-2xl font-bold text-gray-900">{title}</h1>
				<p className="mt-3 text-sm text-gray-600">{description}</p>
				<p className="mt-3 text-xs text-gray-500">
					This screen is parked outside the M1 mock identity demo. Use the labeled mock login
					instead.
				</p>
				<p className="mt-6">
					<Link href={LOGIN_PATH} className="text-sm font-medium text-blue-600 hover:underline">
						Back to sign in
					</Link>
				</p>
			</div>
		</div>
	);
}
