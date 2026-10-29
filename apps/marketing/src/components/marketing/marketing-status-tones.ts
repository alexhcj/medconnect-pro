import type {BadgeTone} from '@/components/ui/badge';

/** Single source of truth for status-label tones on /security, /about and /demo cards. */
export const MARKETING_STATUS_TONES = {
	'Implemented pattern': 'success',
	Shipped: 'success',
	Current: 'success',
	'In progress': 'accent',
	'Up next': 'neutral',
	'Not shipped': 'neutral',
	Planned: 'neutral',
	Partial: 'warning',
	Paused: 'warning',
	'Must not claim': 'warning',
} as const satisfies Record<string, BadgeTone>;

export type MarketingStatusLabel = keyof typeof MARKETING_STATUS_TONES;

export function marketingStatusTone(label: MarketingStatusLabel): BadgeTone {
	return MARKETING_STATUS_TONES[label] ?? 'neutral';
}
