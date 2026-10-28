import type {ReactNode} from 'react';
import {cn} from '@/lib/utils/utils';

export type MarketingBandTone = 'surface' | 'canvas' | 'brand';

const BAND_TONE_CLASS_NAME: Record<MarketingBandTone, string> = {
	surface: 'bg-surface',
	canvas: 'bg-canvas',
	brand: 'bg-brand-subtle',
};

interface MarketingBandProps {
	tone?: MarketingBandTone;
	children: ReactNode;
	className?: string;
}

/** Full-bleed background with the standard marketing content container inside. */
export function MarketingBand({tone = 'surface', children, className}: MarketingBandProps) {
	return (
		<div className={BAND_TONE_CLASS_NAME[tone]}>
			<div
				className={cn(
					'mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20',
					className,
				)}
			>
				{children}
			</div>
		</div>
	);
}
