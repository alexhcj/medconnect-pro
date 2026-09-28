import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {MarketingPage} from '@/components/marketing/marketing-page';
import {marketingMetadata} from '@/lib/marketing/metadata';

export const metadata = marketingMetadata(
	'Platform',
	'Overview of MedConnect Pro demo modules: patients, appointments, telehealth session shell, billing invoices, and administration.',
);

const MODULES = [
	{
		title: 'Patient management',
		description:
			'List, profile, create, and edit flows against synthetic patient records.',
	},
	{
		title: 'Appointments and scheduling',
		description: 'Appointment creation and calendar views in the authenticated demo.',
	},
	{
		title: 'Telehealth',
		description:
			'Appointment-linked telehealth session shell. This is not live video or Daily media.',
	},
	{
		title: 'Billing',
		description:
			'Invoice list and labeled payment/claims boundaries. This is not hosted payments.',
	},
	{
		title: 'Administration',
		description: 'Practice user directory and audit viewer in the demo application.',
	},
	{
		title: 'Analytics',
		description:
			'Mock dashboard overview cards. A live dashboard analytics API is not wired.',
	},
] as const;

export default function PlatformPage() {
	return (
		<MarketingPage
			title="Platform"
			intro="MedConnect Pro demonstrates connected practice workflows in a single application. The modules below exist in the demo. Dedicated feature pages can be added later under this route without changing the marketing layout."
		>
			<h2 className="text-xl font-semibold text-gray-900">Demo modules</h2>
			<ul className="grid gap-4 sm:grid-cols-2">
				{MODULES.map((module) => (
					<li key={module.title}>
						<Card className="h-full">
							<CardHeader>
								<CardTitle>{module.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription>{module.description}</CardDescription>
							</CardContent>
						</Card>
					</li>
				))}
			</ul>
		</MarketingPage>
	);
}
