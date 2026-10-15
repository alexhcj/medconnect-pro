import type {MetadataRoute} from 'next';
import {siteUrl} from '@/lib/marketing/public-urls';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: '/',
		},
		sitemap: new URL('/sitemap.xml', `${siteUrl()}/`).toString(),
	};
}
