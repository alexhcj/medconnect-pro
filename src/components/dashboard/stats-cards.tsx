'use client'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Activity, Calendar, DollarSign, TrendingDown, TrendingUp, Users} from 'lucide-react'

interface StatCardProps {
	title: string
	value: string | number
	icon: React.ReactNode
	trend?: {
		value: number
		direction: 'up' | 'down'
	}
	description?: string
}

const StatCard = ({title, value, icon, trend, description}: StatCardProps) => {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium text-gray-600">
					{title}
				</CardTitle>
				<div className="text-gray-400">
					{icon}
				</div>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold text-gray-900">{value}</div>
				{trend && (
					<div className="flex items-center space-x-2 text-sm">
						{trend.direction === 'up' ? (
							<TrendingUp className="h-4 w-4 text-green-500"/>
						) : (
							<TrendingDown className="h-4 w-4 text-red-500"/>
						)}
						<span className={trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
              {trend.value}%
            </span>
						<span className="text-gray-500">from last month</span>
					</div>
				)}
				{description && (
					<p className="text-xs text-gray-500 mt-1">{description}</p>
				)}
			</CardContent>
		</Card>
	)
}

const StatsCards = () => {
	const stats = [
		{
			title: "Total Patients",
			value: "2,834",
			icon: <Users className="h-4 w-4"/>,
			trend: {value: 12, direction: 'up' as const},
			description: "Active patients in system"
		},
		{
			title: "Today's Appointments",
			value: "24",
			icon: <Calendar className="h-4 w-4"/>,
			trend: {value: 5, direction: 'down' as const},
			description: "Scheduled for today"
		},
		{
			title: "Monthly Revenue",
			value: "$45,231",
			icon: <DollarSign className="h-4 w-4"/>,
			trend: {value: 8, direction: 'up' as const},
			description: "This month's earnings"
		},
		{
			title: "Patient Satisfaction",
			value: "98.2%",
			icon: <Activity className="h-4 w-4"/>,
			trend: {value: 2, direction: 'up' as const},
			description: "Average rating"
		}
	]

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{stats.map((stat, index) => (
				<StatCard key={index} {...stat} />
			))}
		</div>
	)
}

export {StatsCards, StatCard}