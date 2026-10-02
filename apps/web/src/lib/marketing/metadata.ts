import type {Metadata} from 'next';
import {MARKETING_OG_IMAGE} from '@/components/marketing/marketing-product-visuals';

const OPEN_GRAPH_IMAGE = {
	url: MARKETING_OG_IMAGE.src,
	width: MARKETING_OG_IMAGE.width,
	height: MARKETING_OG_IMAGE.height,
	alt: MARKETING_OG_IMAGE.alt,
};

export function marketingMetadata(title: string, description: string): Metadata {
	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: 'website',
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
