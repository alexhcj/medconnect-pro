import type {MetadataRoute} from 'next';
import {absoluteMarketingUrl, MARKETING_PATHS} from '@/lib/marketing/public-urls';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
	return MARKETING_PATHS.map((path) => ({
		url: absoluteMarketingUrl(path),
	}));
}
