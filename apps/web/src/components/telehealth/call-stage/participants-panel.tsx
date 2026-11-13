'use client';

import {useEffect, useRef} from 'react';
import {Mic, MicOff, ShieldCheck, Video, VideoOff, WifiLow, X} from 'lucide-react';
import {RoleTag, isWeakNetwork} from '@/components/telehealth/call-stage/participant-tile';
import type {StageTile} from '@/lib/telehealth/call-participants';
import {cn} from '@/lib/utils/utils';

const MUTED = 'text-gray-600 max-sm:text-(--color-stage-text-muted)';
const DIVIDER = 'border-gray-200 max-sm:border-(--color-stage-border)';

/**
 * Read-only list of who is in the call: name, role tag, mic and camera state, weak network. There is
 * no mute, remove or lock (M23). One element, three layouts: a bottom sheet at 390 px and below, an
 * overlay drawer up to 1023 px, and a side column at 1024 px and wider. Escape closes it and focus
 * returns to the control that opened it.
 */
export function ParticipantsPanel({tiles, onClose}: {tiles: StageTile[]; onClose: () => void}) {
	const closeRef = useRef<HTMLButtonElement>(null);
	const onCloseRef = useRef(onClose);
	useEffect(() => {
		onCloseRef.current = onClose;
	});

	useEffect(() => {
		const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		closeRef.current?.focus();
		return () => {
			if (opener && document.contains(opener)) {
				opener.focus();
			}
		};
	}, []);

	return (
		<aside
			aria-label="Participants"
			onKeyDown={(event) => {
				if (event.key === 'Escape') {
					event.stopPropagation();
					onCloseRef.current();
				}
			}}
			className={cn(
				'z-40 flex flex-col bg-white text-gray-900 shadow-xl',
				'max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[70vh] max-sm:rounded-t-[20px] max-sm:bg-(--color-stage-surface) max-sm:text-(--color-stage-text)',
				'sm:max-lg:fixed sm:max-lg:inset-y-0 sm:max-lg:right-0 sm:max-lg:w-[360px]',
				'lg:relative lg:w-[360px] lg:shrink-0 lg:shadow-none',
			)}
		>
			<div className={cn('flex items-center justify-between gap-3 border-b px-4 py-3', DIVIDER)}>
				<h2 className="text-lg font-semibold">Participants ({tiles.length})</h2>
				<button
					ref={closeRef}
					type="button"
					aria-label="Close participants"
					onClick={onClose}
					className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-gray-300 text-gray-900 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:border-(--color-stage-border) max-sm:bg-(--color-stage-surface-raised) max-sm:text-(--color-stage-text) max-sm:hover:bg-(--color-stage-surface-raised)"
				>
					<X aria-hidden="true" className="size-5" />
				</button>
			</div>

			<ul className="flex-1 overflow-y-auto px-4">
				{tiles.map((tile) => {
					const weak = isWeakNetwork(tile);
					return (
						<li
							key={tile.id}
							className={cn('flex items-center gap-3 border-b py-3 last:border-b-0', DIVIDER)}
						>
							<span
								aria-hidden="true"
								className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 max-sm:bg-(--color-stage-surface-raised) max-sm:text-(--color-stage-text)"
							>
								{tile.initials}
							</span>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium">
									{tile.name}
									{tile.isLocal && tile.name !== 'You' ? ' (you)' : ''}
								</p>
								<div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
									{tile.role && <RoleTag role={tile.role} />}
									{weak && (
										<span className="flex items-center gap-1 text-xs font-medium text-amber-700 max-sm:text-amber-300">
											<WifiLow aria-hidden="true" className="size-4" />
											Weak network
										</span>
									)}
								</div>
							</div>
							<span className={cn('flex items-center gap-3', MUTED)}>
								{tile.audioOn ? (
									<Mic aria-hidden="true" className="size-5" />
								) : (
									<MicOff aria-hidden="true" className="size-5" />
								)}
								<span className="sr-only">{tile.audioOn ? 'Microphone on' : 'Microphone off'}</span>
								{tile.videoOn ? (
									<Video aria-hidden="true" className="size-5" />
								) : (
									<VideoOff aria-hidden="true" className="size-5" />
								)}
								<span className="sr-only">{tile.videoOn ? 'Camera on' : 'Camera off'}</span>
							</span>
						</li>
					);
				})}
			</ul>

			<p className={cn('flex items-center gap-2 border-t px-4 py-3 pb-6 text-sm sm:pb-3', DIVIDER, MUTED)}>
				<ShieldCheck aria-hidden="true" className="size-4" />
				Only invited participants can join
			</p>
		</aside>
	);
}
