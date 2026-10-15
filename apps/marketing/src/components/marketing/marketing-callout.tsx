interface MarketingCalloutProps {
	headingId: string;
	heading: string;
	body: string;
}

export function MarketingCallout({headingId, heading, body}: MarketingCalloutProps) {
	return (
		<div
			role="note"
			aria-labelledby={headingId}
			className="rounded-xl bg-warning-subtle px-6 py-4 text-warning"
		>
			<p id={headingId} className="text-lg font-semibold">
				{heading}
			</p>
			<p className="mt-2 text-base leading-relaxed">{body}</p>
		</div>
	);
}
