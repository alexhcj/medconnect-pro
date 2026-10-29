'use client';

import {type KeyboardEvent, type RefObject} from 'react';
import {MarketingProductImage} from '@/components/marketing/marketing-product-image';
import {
	MARKETING_PRODUCT_SLIDES,
	MARKETING_PRODUCT_VISUAL_CAPTION,
} from '@/components/marketing/marketing-product-visuals';

const SLIDE_GAP_PX = 16;

function prefersReducedMotion(): boolean {
	return (
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

function slideStride(track: HTMLDivElement): number {
	const slide = track.querySelector('[data-product-slide]');
	return slide instanceof HTMLElement ? slide.offsetWidth + SLIDE_GAP_PX : 0;
}

export function scrollProductUiTrackTo(track: HTMLDivElement | null, index: number) {
	if (!track) {
		return;
	}
	track.scrollTo({
		left: index * slideStride(track),
		behavior: prefersReducedMotion() ? 'auto' : 'smooth',
	});
}

/** Index of the slide closest to the track's scroll position. */
export function productUiTrackIndex(track: HTMLDivElement): number {
	const stride = slideStride(track);
	if (stride <= 0) {
		return 0;
	}
	const index = Math.round(track.scrollLeft / stride);
	return Math.min(Math.max(index, 0), MARKETING_PRODUCT_SLIDES.length - 1);
}

interface MarketingProductUiSliderProps {
	trackRef: RefObject<HTMLDivElement | null>;
	onStep: (direction: -1 | 1) => void;
	onTrackScroll: () => void;
	onTrackScrollEnd: () => void;
}

export function MarketingProductUiSlider({
	trackRef,
	onStep,
	onTrackScroll,
	onTrackScrollEnd,
}: MarketingProductUiSliderProps) {
	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			onStep(-1);
		}
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			onStep(1);
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
					className="flex items-start gap-4 overflow-x-auto snap-x snap-mandatory motion-safe:scroll-smooth"
					onScroll={onTrackScroll}
					onScrollEnd={onTrackScrollEnd}
				>
					{MARKETING_PRODUCT_SLIDES.map((slide, index) => (
						<div
							key={slide.id}
							role="group"
							aria-roledescription="slide"
							aria-label={`${index + 1} of ${MARKETING_PRODUCT_SLIDES.length}: ${slide.label}`}
							data-product-slide
							className="w-full shrink-0 snap-start"
						>
							<MarketingProductImage src={slide.src} alt={slide.alt} className="h-auto" />
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
