'use client';

import {useEffect, useRef, useState} from 'react';
import {CircleAlert, CircleCheck, Clock, LoaderCircle, type LucideIcon} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useApiStatusContext} from '@/components/auth/api-status-provider';
import {apiStatusAnnouncement, type ApiStatusPhase} from '@/lib/api-status/api-status-machine';
import {cn} from '@/lib/utils/utils';

const CARD_ID = 'api-status-card';
const ATTENTION_MS = 2400;

interface PhaseView {
	label: string;
	title: string;
	body: string;
	Icon: LucideIcon;
	/** Pill tone: background, border and text colour. */
	pill: string;
	text: string;
}

const PHASE_VIEW: Record<Exclude<ApiStatusPhase, 'idle'>, PhaseView> = {
	checking: {
		label: 'Checking API',
		title: 'Checking API',
		body: 'Checking whether the API is awake.',
		Icon: LoaderCircle,
		pill: 'bg-surface border-border',
		text: 'text-foreground-secondary',
	},
	waking: {
		label: 'Waking up',
		title: 'Waking up',
		body: 'Free tier sleeps when idle. Waking the API, usually about a minute.',
		Icon: Clock,
		pill: 'bg-warning-subtle border-border-strong',
		text: 'text-warning',
	},
	ready: {
		label: 'API ready',
		title: 'API ready',
		body: 'The API is awake. Free tier sleeps again when idle.',
		Icon: CircleCheck,
		pill: 'bg-surface border-border',
		text: 'text-success-strong',
	},
	unreachable: {
		label: 'API unreachable',
		title: 'API unreachable',
		body: 'No response after about 90 s. The API may still be starting.',
		Icon: CircleAlert,
		pill: 'bg-surface border-border-danger',
		text: 'text-danger',
	},
};

/**
 * Fixed bottom-right API status for `/login` (FE-049, ADR-017). A real button toggles a small
 * non-modal card: it opens by itself while the free-tier API wakes or is unreachable and collapses
 * to a dot once ready. Colour is never the only signal (icon plus text). Renders nothing in mock
 * mode and PR previews.
 */
export function ApiStatusIndicator() {
	const status = useApiStatusContext();
	const triggerRef = useRef<HTMLButtonElement>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const [peek, setPeek] = useState(false);
	const [attention, setAttention] = useState(false);
	const pulse = status?.state.pulse ?? 0;
	const enabled = status?.enabled ?? false;

	useEffect(() => {
		if (pulse === 0) {
			return;
		}
		setAttention(true);
		const timer = setTimeout(() => setAttention(false), ATTENTION_MS);
		return () => clearTimeout(timer);
	}, [pulse]);

	// Publish the indicator height so the page reserves room below the form on small screens.
	useEffect(() => {
		const root = rootRef.current;
		if (!enabled || !root || typeof ResizeObserver === 'undefined') {
			return;
		}
		const publish = () =>
			document.documentElement.style.setProperty('--api-status-reserve', `${root.offsetHeight + 16}px`);
		publish();
		const observer = new ResizeObserver(publish);
		observer.observe(root);
		return () => {
			observer.disconnect();
			document.documentElement.style.removeProperty('--api-status-reserve');
		};
	}, [enabled]);

	if (!status || !status.enabled) {
		return null;
	}

	const {state, begin, toggle, close, retry} = status;
	const {phase, expanded} = state;
	const view = phase === 'idle' ? null : PHASE_VIEW[phase];
	const restingDot = (phase === 'idle' || phase === 'ready') && !expanded && !peek;
	const Icon = view?.Icon;
	const open = expanded && phase !== 'idle';

	const triggerLabel = view ? `API status: ${view.label}` : 'API status';

	return (
		<div
			ref={rootRef}
			className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex flex-col items-end gap-2 min-[480px]:left-auto min-[480px]:right-6 min-[480px]:bottom-6 min-[480px]:inset-x-auto"
			onKeyDown={(event) => {
				if (event.key === 'Escape' && open) {
					close();
					triggerRef.current?.focus();
				}
			}}
		>
			<p role="status" className="sr-only">
				{apiStatusAnnouncement(phase)}
			</p>

			{open && view && Icon && (
				<div
					id={CARD_ID}
					aria-labelledby={`${CARD_ID}-title`}
					className={cn(
						'pointer-events-auto flex w-full flex-col gap-3 rounded-xl border bg-surface p-4 shadow-lg min-[480px]:w-72',
						phase === 'unreachable' ? 'border-border-danger' : 'border-border',
					)}
				>
					<div className={cn('flex items-center gap-2 text-sm font-medium', view.text)}>
						<Icon
							className={cn('size-5 shrink-0', phase === 'checking' && 'motion-safe:animate-spin')}
							aria-hidden="true"
						/>
						<span id={`${CARD_ID}-title`}>{view.title}</span>
					</div>
					<p className="text-sm text-foreground-secondary">{view.body}</p>
					{phase === 'waking' && (
						<p className="text-xs text-foreground-muted">Elapsed {state.elapsedSeconds} s</p>
					)}
					{phase === 'unreachable' && (
						<div>
							<Button type="button" variant="outline" size="sm" className="min-h-11" onClick={retry}>
								Retry
							</Button>
						</div>
					)}
				</div>
			)}

			<button
				ref={triggerRef}
				type="button"
				aria-expanded={open}
				aria-controls={open ? CARD_ID : undefined}
				aria-label={restingDot ? triggerLabel : undefined}
				onClick={() => (phase === 'idle' ? begin() : toggle())}
				onPointerEnter={(event) => event.pointerType === 'mouse' && setPeek(true)}
				onPointerLeave={() => setPeek(false)}
				className={cn(
					'pointer-events-auto relative shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
					'before:absolute before:-inset-y-0.5 before:inset-x-0 before:content-[""]',
					attention && 'api-status-attention',
					restingDot
						? 'grid size-11 place-items-center rounded-full'
						: cn(
								'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium shadow-lg',
								view?.pill ?? 'bg-surface border-border',
								view?.text ?? 'text-foreground-secondary',
							),
				)}
			>
				{restingDot ? (
					<span
						aria-hidden="true"
						className={cn(
							'block size-4 rounded-full border-2 border-surface shadow-sm',
							phase === 'ready' ? 'bg-success' : 'bg-foreground-muted',
						)}
					/>
				) : (
					<>
						{Icon && (
							<Icon
								className={cn('size-4 shrink-0', phase === 'checking' && 'motion-safe:animate-spin')}
								aria-hidden="true"
							/>
						)}
						<span>
							{phase === 'waking'
								? `Waking up · ${state.elapsedSeconds} s`
								: (view?.label ?? 'API status')}
						</span>
					</>
				)}
			</button>
		</div>
	);
}
