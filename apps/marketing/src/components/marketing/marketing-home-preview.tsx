'use client';

import {useRef, useState} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {MARKETING_HOME_PREVIEW} from '@/components/marketing/marketing-home-copy';
import {
	MarketingProductUiSlider,
	productUiTrackIndex,
	scrollProductUiTrackTo,
} from '@/components/marketing/marketing-product-ui-slider';
import {MARKETING_PRODUCT_SLIDES} from '@/components/marketing/marketing-product-visuals';
import {MarketingSection} from '@/components/marketing/marketing-section';
import {Button} from '@/components/ui/button';

const LAST_INDEX = MARKETING_PRODUCT_SLIDES.length - 1;

function slideAnnouncement(index: number): string {
	return `Slide ${index + 1} of ${MARKETING_PRODUCT_SLIDES.length}: ${MARKETING_PRODUCT_SLIDES[index].label}`;
}

export function MarketingHomePreview() {
	const trackRef = useRef<HTMLDivElement>(null);
	/** Slide a requested scroll is heading to; scroll sync waits until it is reached. */
	const pendingIndexRef = useRef<number | null>(null);
	const [current, setCurrent] = useState(0);
	const [announcement, setAnnouncement] = useState('');

	/** User-initiated moves only: the live region stays silent on load and on passive scroll. */
	function goTo(index: number) {
		const next = Math.min(Math.max(index, 0), LAST_INDEX);
		const track = trackRef.current;
		pendingIndexRef.current = track && productUiTrackIndex(track) !== next ? next : null;
		setCurrent(next);
		setAnnouncement(slideAnnouncement(next));
		scrollProductUiTrackTo(track, next);
	}

	function handleTrackScroll() {
		const track = trackRef.current;
		if (!track) {
			return;
		}
		const index = productUiTrackIndex(track);
		if (pendingIndexRef.current !== null) {
			if (index === pendingIndexRef.current) {
				pendingIndexRef.current = null;
			}
			return;
		}
		setCurrent(index);
	}

	function handleTrackScrollEnd() {
		pendingIndexRef.current = null;
		handleTrackScroll();
	}

	return (
		<MarketingSection
			headingId={MARKETING_HOME_PREVIEW.headingId}
			title={MARKETING_HOME_PREVIEW.heading}
		>
			<div
				role="group"
				aria-label="Choose a product screen"
				className="-m-1 mb-5 flex gap-2 overflow-x-auto p-1 md:flex-wrap"
			>
				{MARKETING_PRODUCT_SLIDES.map((slide, index) => (
					<Button
						key={slide.id}
						type="button"
						size="sm"
						variant={index === current ? 'default' : 'outline'}
						aria-current={index === current ? 'true' : undefined}
						className="h-11 shrink-0"
						onClick={() => {
							goTo(index);
						}}
					>
						{slide.label}
					</Button>
				))}
			</div>
			<MarketingProductUiSlider
				trackRef={trackRef}
				onStep={(direction) => {
					goTo(current + direction);
				}}
				onTrackScroll={handleTrackScroll}
				onTrackScrollEnd={handleTrackScrollEnd}
			/>
			<div className="mt-4 flex items-center justify-center gap-4">
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="size-11"
					aria-label="Previous product screen"
					disabled={current === 0}
					onClick={() => {
						goTo(current - 1);
					}}
				>
					<ChevronLeft className="h-4 w-4" aria-hidden />
				</Button>
				<p aria-hidden className="min-w-12 text-center text-sm font-medium text-foreground-secondary">
					{current + 1} / {MARKETING_PRODUCT_SLIDES.length}
				</p>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="size-11"
					aria-label="Next product screen"
					disabled={current === LAST_INDEX}
					onClick={() => {
						goTo(current + 1);
					}}
				>
					<ChevronRight className="h-4 w-4" aria-hidden />
				</Button>
			</div>
			<p className="sr-only" aria-live="polite" data-slide-announcement>
				{announcement}
			</p>
		</MarketingSection>
	);
}
