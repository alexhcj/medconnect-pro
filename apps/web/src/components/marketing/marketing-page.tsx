interface MarketingPageProps {
	title: string;
	intro: string;
	children?: React.ReactNode;
}

export function MarketingPage({title, intro, children}: MarketingPageProps) {
	return (
		<div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
			<h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
			<p className="mt-6 max-w-3xl text-lg leading-relaxed text-foreground-secondary">{intro}</p>
			{children ? <div className="mt-10 space-y-8">{children}</div> : null}
		</div>
	);
}
