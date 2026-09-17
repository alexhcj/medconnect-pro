'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Activity, Calendar, DollarSign, TrendingDown, TrendingUp, Users} from 'lucide-react';
import type {DashboardMetric, DashboardMetricIcon} from '@/types/dashboard/overview';

interface StatCardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	trend?: {
		value: number;
		direction: 'up' | 'down';
	};
	description?: string;
}

const ICON_MAP: Record<DashboardMetricIcon, React.ReactNode> = {
	users: <Users className="h-4 w-4" aria-hidden />,
	calendar: <Calendar className="h-4 w-4" aria-hidden />,
	revenue: <DollarSign className="h-4 w-4" aria-hidden />,
	satisfaction: <Activity className="h-4 w-4" aria-hidden />,
};

const StatCard = ({title, value, icon, trend, description}: StatCardProps) => {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
				<div className="text-gray-400">{icon}</div>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold text-gray-900">{value}</div>
				{trend && (
					<div className="flex items-center space-x-2 text-sm">
						{trend.direction === 'up' ? (
							<TrendingUp className="h-4 w-4 text-green-500" aria-hidden />
						) : (
							<TrendingDown className="h-4 w-4 text-red-500" aria-hidden />
						)}
						<span className={trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
							{trend.value}%
						</span>
						<span className="text-gray-500">from last month</span>
					</div>
				)}
				{description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
			</CardContent>
		</Card>
	);
};

interface StatsCardsProps {
	metrics: DashboardMetric[];
}

const StatsCards = ({metrics}: StatsCardsProps) => {
	if (metrics.length === 0) {
		return <p className="text-sm text-gray-600">No overview metrics for this role.</p>;
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			{metrics.map((metric) => (
				<StatCard
					key={metric.id}
					title={metric.title}
					value={metric.value}
					icon={ICON_MAP[metric.icon]}
					trend={metric.trend}
					description={metric.description}
				/>
			))}
		</div>
	);
};

export {StatsCards, StatCard};
