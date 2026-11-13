'use client';

import type {ReactNode} from 'react';
import {Dialog, DialogBackdrop, DialogPanel, DialogTitle} from '@headlessui/react';
import {ChevronRight, PhoneOff, SlidersHorizontal, Sparkles, Users} from 'lucide-react';
import {cn} from '@/lib/utils/utils';

function SheetRow({
	icon,
	title,
	subtitle,
	onClick,
	danger,
}: {
	icon: ReactNode;
	title: string;
	subtitle: string;
	onClick: () => void;
	danger?: boolean;
}) {
	return (
		<li className="border-b border-(--color-stage-border) last:border-b-0">
			<button
				type="button"
				onClick={onClick}
				className="flex min-h-16 w-full cursor-pointer items-center gap-3.5 rounded-lg px-1 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<span
					aria-hidden="true"
					className={cn(
						'flex size-11 shrink-0 items-center justify-center rounded-full text-(--color-stage-text)',
						danger ? 'bg-destructive' : 'bg-(--color-stage-surface-raised)',
					)}
				>
					{icon}
				</span>
				<span className="min-w-0 flex-1">
					<span className="block text-base font-medium text-(--color-stage-text)">{title}</span>
					<span className="block text-sm text-(--color-stage-text-muted)">{subtitle}</span>
				</span>
				<ChevronRight aria-hidden="true" className="size-5 shrink-0 text-(--color-stage-text-muted)" />
			</button>
		</li>
	);
}

/**
 * The 390 px and below overflow sheet: Devices, Participants, Background and, for the host only,
 * End visit. Share screen is not here; it is hidden where the browser cannot share. Headless UI
 * traps focus and returns it to the More button on close.
 */
export function MoreSheet({
	open,
	onClose,
	participantCount,
	canEnd,
	onOpenDevices,
	onOpenParticipants,
	onOpenBackground,
	onRequestEnd,
}: {
	open: boolean;
	onClose: () => void;
	participantCount: number;
	canEnd: boolean;
	onOpenDevices: () => void;
	onOpenParticipants: () => void;
	onOpenBackground: () => void;
	onRequestEnd: () => void;
}) {
	const choose = (action: () => void) => () => {
		onClose();
		action();
	};

	return (
		<Dialog open={open} onClose={onClose} className="relative z-[60] sm:hidden">
			<DialogBackdrop className="fixed inset-0 bg-black/60" />
			<div className="fixed inset-x-0 bottom-0">
				<DialogPanel className="rounded-t-[20px] border border-b-0 border-(--color-stage-border) bg-(--color-stage-surface) px-4 pb-8 pt-3 text-(--color-stage-text)">
					<div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-(--color-stage-border-strong)" />
					<DialogTitle className="px-1 pb-3 pt-1 text-lg font-semibold">More</DialogTitle>
					<ul>
						<SheetRow
							icon={<SlidersHorizontal className="size-5" />}
							title="Devices"
							subtitle="Camera, microphone and speaker"
							onClick={choose(onOpenDevices)}
						/>
						<SheetRow
							icon={<Users className="size-5" />}
							title="Participants"
							subtitle={`${participantCount} in this visit`}
							onClick={choose(onOpenParticipants)}
						/>
						<SheetRow
							icon={<Sparkles className="size-5" />}
							title="Background"
							subtitle="Blur or choose a virtual background"
							onClick={choose(onOpenBackground)}
						/>
						{canEnd && (
							<SheetRow
								danger
								icon={<PhoneOff className="size-5" />}
								title="End visit"
								subtitle="Disconnect everyone and end the visit"
								onClick={choose(onRequestEnd)}
							/>
						)}
					</ul>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
