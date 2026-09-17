interface FeaturePlaceholderProps {
	title: string;
	description: string;
}

export function FeaturePlaceholder({title, description}: FeaturePlaceholderProps) {
	return (
		<div>
			<h1 className="text-2xl font-bold text-gray-900">{title}</h1>
			<p className="mt-2 text-sm text-gray-600">{description}</p>
		</div>
	);
}
