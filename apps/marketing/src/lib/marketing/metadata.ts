import type {Metadata} from 'next';
import {MARKETING_OG_IMAGE} from '@/components/marketing/marketing-product-visuals';
import {absoluteMarketingUrl} from '@/lib/marketing/public-urls';

const OPEN_GRAPH_IMAGE = {
	url: MARKETING_OG_IMAGE.src,
	width: MARKETING_OG_IMAGE.width,
	height: MARKETING_OG_IMAGE.height,
	alt: MARKETING_OG_IMAGE.alt,
};

export function marketingMetadata(title: string, description: string, path = '/'): Metadata {
	const canonical = absoluteMarketingUrl(path);
	return {
		title,
		description,
		alternates: {
			canonical,
		},
		openGraph: {
			title,
			description,
			type: 'website',
			url: canonical,
			images: [OPEN_GRAPH_IMAGE],
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: [MARKETING_OG_IMAGE.src],
		},
	};
}
