'use client'

import {useState} from 'react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {cn} from '@/lib/utils'
import {Button} from '@/components/ui/button'
import {Bell, Calendar, CreditCard, LayoutDashboard, Menu, Settings, User, Users, Video, X} from 'lucide-react'

const navigation = [
	{name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard},
	{name: 'Patients', href: '/dashboard/patients', icon: Users},
	{name: 'Appointments', href: '/dashboard/appointments', icon: Calendar},
	{name: 'Telehealth', href: '/dashboard/telehealth', icon: Video},
	{name: 'Billing', href: '/dashboard/billing', icon: CreditCard},
	{name: 'Settings', href: '/dashboard/settings', icon: Settings},
]

export default function DashboardLayout({
																					children,
																				}: {
	children: React.ReactNode
}) {
	const pathname = usePathname()
	const [sidebarOpen, setSidebarOpen] = useState(false)

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Mobile sidebar backdrop */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<div className={cn(
				"fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
				sidebarOpen ? "translate-x-0" : "-translate-x-full"
			)}>
				<div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
							<span className="text-white font-bold text-sm">MC</span>
						</div>
						<span className="text-xl font-semibold text-gray-900">MedConnect Pro</span>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="lg:hidden"
						onClick={() => setSidebarOpen(false)}
					>
						<X className="h-5 w-5"/>
					</Button>
				</div>

				<nav className="mt-6 px-3">
					<div className="space-y-1">
						{navigation.map((item) => {
							const isActive = pathname === item.href
							return (
								<Link key={item.name} href={item.href}>
									<div className={cn(
										"flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
										isActive
											? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
											: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
									)}>
										<item.icon className={cn(
											"mr-3 h-5 w-5",
											isActive ? "text-blue-500" : "text-gray-400"
										)}/>
										{item.name}
									</div>
								</Link>
							)
						})}
					</div>
				</nav>
			</div>

			{/* Main content */}
			<div className="lg:pl-64">
				{/* Top header */}
				<header className="bg-white shadow-sm border-b border-gray-200">
					<div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
						<Button
							variant="ghost"
							size="icon"
							className="lg:hidden"
							onClick={() => setSidebarOpen(true)}
						>
							<Menu className="h-5 w-5"/>
						</Button>

						<div className="flex items-center space-x-4">
							<Button variant="ghost" size="icon">
								<Bell className="h-5 w-5"/>
							</Button>
							<Button variant="ghost" size="icon">
								<User className="h-5 w-5"/>
							</Button>
						</div>
					</div>
				</header>

				{/* Page content */}
				<main className="p-4 sm:p-6 lg:p-8">
					{children}
				</main>
			</div>
		</div>
	)
}