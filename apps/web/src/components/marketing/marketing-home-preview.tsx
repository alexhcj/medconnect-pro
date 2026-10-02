'use client';

import {useRef} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {MARKETING_HOME_PREVIEW} from '@/components/marketing/marketing-home-copy';
import {
	MarketingProductUiSlider,
	scrollProductUiTrack,
} from '@/components/marketing/marketing-product-ui-slider';
import {MarketingSection} from '@/components/marketing/marketing-section';
import {Button} from '@/components/ui/button';

export function MarketingHomePreview() {
	const trackRef = useRef<HTMLDivElement>(null);

	function scrollBySlide(direction: -1 | 1) {
		scrollProductUiTrack(trackRef.current, direction);
	}

	return (
		<MarketingSection
			headingId={MARKETING_HOME_PREVIEW.headingId}
			title={MARKETING_HOME_PREVIEW.heading}
			actions={
				<>
					<Button
						type="button"
						variant="outline"
						size="icon"
						aria-label="Previous product screen"
						onClick={() => {
							scrollBySlide(-1);
						}}
					>
						<ChevronLeft className="h-4 w-4" aria-hidden />
					</Button>
					<Button
						type="button"
						variant="outline"
						size="icon"
						aria-label="Next product screen"
						onClick={() => {
							scrollBySlide(1);
						}}
					>
						<ChevronRight className="h-4 w-4" aria-hidden />
					</Button>
				</>
			}
		>
			<MarketingProductUiSlider trackRef={trackRef} onScrollBySlide={scrollBySlide} />
		</MarketingSection>
	);
}
