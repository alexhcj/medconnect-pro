'use client';

import {DashboardAuthGate} from '@/components/auth/dashboard-auth-gate';
import {DashboardShell} from '@/components/dashboard/dashboard-shell';

export default function DashboardGroupLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<DashboardAuthGate>
			<DashboardShell>{children}</DashboardShell>
		</DashboardAuthGate>
	);
}
