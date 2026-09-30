import Link from 'next/link';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {MARKETING_PLATFORM_MODULES} from '@/components/marketing/marketing-platform-copy';
import {MarketingSection} from '@/components/marketing/marketing-section';

export function MarketingPlatformModules() {
	return (
		<MarketingSection
			headingId={MARKETING_PLATFORM_MODULES.headingId}
			title={MARKETING_PLATFORM_MODULES.heading}
		>
			<ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{MARKETING_PLATFORM_MODULES.items.map((module) => (
					<li key={module.href}>
						<Card className="h-full">
							<CardHeader>
								<CardTitle>{module.title}</CardTitle>
								<CardDescription className="text-sm leading-relaxed">
									{module.description}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-foreground">{module.status}</p>
							</CardContent>
							<CardFooter>
								<Link
									href={module.href}
									className="rounded-md text-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									{module.href}
								</Link>
							</CardFooter>
						</Card>
					</li>
				))}
			</ul>
		</MarketingSection>
	);
}
