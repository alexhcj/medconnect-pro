import Link from 'next/link';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

export interface MarketingStatusCardLink {
	label: string;
	href: string;
}

export interface MarketingStatusCardProps {
	title: string;
	description: string;
	detail: string;
	status: string | MarketingStatusCardLink;
}

export function MarketingStatusCard({
	title,
	description,
	detail,
	status,
}: MarketingStatusCardProps) {
	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle className="text-base leading-snug">{title}</CardTitle>
				<CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-sm leading-relaxed text-foreground">{detail}</p>
			</CardContent>
			<CardFooter>
				{typeof status === 'string' ? (
					<p className="text-sm font-medium text-brand">{status}</p>
				) : (
					<Link
						href={status.href}
						className="rounded-md text-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						{status.label}
					</Link>
				)}
			</CardFooter>
		</Card>
	);
}
