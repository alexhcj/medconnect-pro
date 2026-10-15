import {MarketingProductImage} from '@/components/marketing/marketing-product-image';
import {MARKETING_PRODUCT_VISUAL_CAPTION} from '@/components/marketing/marketing-product-visuals';

interface MarketingProductVisualProps {
	src: string;
	alt: string;
	caption?: string;
	frameClassName?: string;
	imageClassName?: string;
}

export function MarketingProductVisual({
	src,
	alt,
	caption = MARKETING_PRODUCT_VISUAL_CAPTION,
	frameClassName,
	imageClassName,
}: MarketingProductVisualProps) {
	return (
		<figure>
			<div className={frameClassName ?? 'mt-4 min-h-[16rem] bg-subtle sm:min-h-[20rem] lg:min-h-[26.25rem]'}>
				<MarketingProductImage src={src} alt={alt} className={imageClassName} />
			</div>
			<figcaption className="mt-3 text-sm text-foreground-secondary">{caption}</figcaption>
		</figure>
	);
}
