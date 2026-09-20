'use client';

import {Button} from '@/components/ui/button';
import {StatsCards} from '@/components/dashboard/stats-cards';
import {useDashboardOverview} from '@/lib/hooks/use-dashboard';
import {useCurrentSession} from '@/lib/hooks/use-session';

const DashboardPage = () => {
	const {data: session} = useCurrentSession();
	const {data, isPending, isError, refetch} = useDashboardOverview();

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
				{session?.userRole && (
					<p className="mt-1 text-sm text-gray-600">Signed in as {session.userRole}.</p>
				)}
			</div>

			{isPending && (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" aria-busy="true">
					<div className="h-28 animate-pulse rounded-lg bg-gray-200" />
					<div className="h-28 animate-pulse rounded-lg bg-gray-200" />
					<div className="h-28 animate-pulse rounded-lg bg-gray-200" />
					<div className="h-28 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading overview metrics</span>
				</div>
			)}

			{isError && (
				<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
					<p className="text-sm text-gray-700">Unable to load overview metrics.</p>
					<Button type="button" className="mt-3" variant="outline" onClick={() => refetch()}>
						Retry
					</Button>
				</div>
			)}

			{data && <StatsCards metrics={data.metrics} />}
		</div>
	);
};

export default DashboardPage;
