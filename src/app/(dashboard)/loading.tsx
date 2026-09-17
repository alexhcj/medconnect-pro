export default function DashboardLoading() {
	return (
		<div className="space-y-4" aria-busy="true" aria-live="polite">
			<span className="sr-only">Loading dashboard</span>
			<div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				<div className="h-28 animate-pulse rounded-lg bg-gray-200" />
				<div className="h-28 animate-pulse rounded-lg bg-gray-200" />
				<div className="h-28 animate-pulse rounded-lg bg-gray-200" />
				<div className="h-28 animate-pulse rounded-lg bg-gray-200" />
			</div>
		</div>
	);
}
