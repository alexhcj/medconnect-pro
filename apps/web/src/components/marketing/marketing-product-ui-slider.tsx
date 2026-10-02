'use client';

import {type KeyboardEvent, type RefObject} from 'react';
import {MarketingProductImage} from '@/components/marketing/marketing-product-image';
import {
	MARKETING_PRODUCT_SLIDES,
	MARKETING_PRODUCT_VISUAL_CAPTION,
} from '@/components/marketing/marketing-product-visuals';

const SLIDE_CLASS_NAME =
	'w-[85%] shrink-0 snap-start md:w-[calc((100%-1rem)/2.15)]';

export function scrollProductUiTrack(
	track: HTMLDivElement | null,
	direction: -1 | 1,
) {
	const slide = track?.querySelector('[data-product-slide]');
	if (!track || !(slide instanceof HTMLElement)) {
		return;
	}

	track.scrollBy({
		left: direction * (slide.offsetWidth + 16),
		behavior: 'smooth',
	});
}

interface MarketingProductUiSliderProps {
	trackRef: RefObject<HTMLDivElement | null>;
	onScrollBySlide: (direction: -1 | 1) => void;
}

export function MarketingProductUiSlider({
	trackRef,
	onScrollBySlide,
}: MarketingProductUiSliderProps) {
	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			onScrollBySlide(-1);
		}
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			onScrollBySlide(1);
		}
	}

	return (
		<figure>
			<div
				role="region"
				aria-roledescription="carousel"
				aria-label="Product screens"
				tabIndex={0}
				className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				onKeyDown={handleKeyDown}
			>
				<div
					ref={trackRef}
					data-product-track
					className="flex items-start gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory"
				>
					{MARKETING_PRODUCT_SLIDES.map((slide) => (
						<div key={slide.id} data-product-slide className={SLIDE_CLASS_NAME}>
							<MarketingProductImage
								src={slide.src}
								alt={slide.alt}
								className="h-auto"
							/>
						</div>
					))}
				</div>
			</div>
			<figcaption className="mt-3 text-sm text-foreground-secondary">
				{MARKETING_PRODUCT_VISUAL_CAPTION}
			</figcaption>
		</figure>
	);
}
