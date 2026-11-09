'use client';

import {useEffect, useRef} from 'react';
import {AudioLines, Mic, MicOff, Video, VideoOff, WifiLow} from 'lucide-react';
import {cn} from '@/lib/utils/utils';
import type {StageTile} from '@/lib/telehealth/call-participants';
import type {Role} from '@/types/auth/roles';

export const ROLE_TAG_LABEL: Partial<Record<Role, string>> = {
	PROVIDER: 'Provider',
	PATIENT: 'Patient',
	NURSE: 'Nurse',
	PRACTICE_ADMIN: 'Practice admin',
	SUPER_ADMIN: 'Admin',
	RECEPTIONIST: 'Reception',
};

export function RoleTag({role, className}: {role: Role; className?: string}) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
				role === 'PROVIDER' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700',
				className,
			)}
		>
			{ROLE_TAG_LABEL[role] ?? role}
		</span>
	);
}

export function isWeakNetwork(tile: Pick<StageTile, 'network'>): boolean {
	return tile.network === 'fair' || tile.network === 'poor';
}

export function TileVideo({
	track,
	muted,
	className = 'object-cover',
}: {
	track: MediaStreamTrack;
	muted: boolean;
	className?: string;
}) {
	const ref = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		const element = ref.current;
		if (!element) {
			return undefined;
		}
		element.srcObject = new MediaStream([track]);
		void element.play().catch(() => undefined);
		return () => {
			element.srcObject = null;
		};
	}, [track]);

	return <video ref={ref} className={cn('absolute inset-0 size-full', className)} autoPlay playsInline muted={muted} />;
}

/**
 * One participant. Name and role come from the Nest roster (see `call-participants.ts`). State is
 * shown with an icon and a screen-reader label, never colour alone. `variant` sizes the nameplate:
 * `grid` and `strip` show the role tag, `pip` is the compact self view.
 */
export function ParticipantTile({
	tile,
	variant = 'grid',
	className,
}: {
	tile: StageTile;
	variant?: 'grid' | 'strip' | 'pip';
	className?: string;
}) {
	const showVideo = tile.videoOn && tile.videoTrack;
	const weak = isWeakNetwork(tile);
	const compact = variant === 'pip';

	return (
		<div
			role="group"
			aria-label={`${tile.name}${tile.role ? `, ${ROLE_TAG_LABEL[tile.role] ?? tile.role}` : ''}`}
			data-speaking={tile.speaking ? 'true' : undefined}
			className={cn(
				'relative flex min-h-0 min-w-0 flex-col justify-end overflow-hidden rounded-xl border bg-(--color-stage-surface)',
				tile.speaking ? 'border-2 border-(--color-focus-brand)' : 'border-(--color-stage-border)',
				className,
			)}
		>
			{showVideo ? (
				<TileVideo track={tile.videoTrack as MediaStreamTrack} muted={tile.isLocal} />
			) : (
				<div
					className={cn('absolute inset-0 flex flex-col items-center justify-center gap-2', !compact && 'pb-12')}
					data-camera-off="true"
				>
					<span
						aria-hidden="true"
						className={cn(
							'flex items-center justify-center rounded-full bg-(--color-stage-surface-raised) font-semibold text-(--color-stage-text)',
							compact ? 'size-10 text-sm' : 'size-20 text-2xl',
						)}
					>
						{tile.initials}
					</span>
					{!compact && <span className="text-sm text-(--color-stage-text-muted)">Camera off</span>}
				</div>
			)}

			{tile.speaking && (
				<span className="absolute right-2 top-2 z-10 flex items-center rounded-md bg-(--color-stage-bg)/80 p-1.5">
					<AudioLines aria-hidden="true" className="size-4 text-(--color-focus-brand)" />
					<span className="sr-only">Speaking</span>
				</span>
			)}

			<div className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6">
				<span className={cn('font-medium text-(--color-stage-text)', compact ? 'text-xs' : 'text-sm')}>
					{tile.name}
				</span>
				{!compact && tile.role && <RoleTag role={tile.role} />}
				<span className="ml-auto flex items-center gap-2 text-(--color-stage-text)">
					{weak && (
						<span className="flex items-center gap-1 text-xs font-medium text-amber-300">
							<WifiLow aria-hidden="true" className="size-4" />
							Weak network
						</span>
					)}
					{tile.audioOn ? (
						<Mic aria-hidden="true" className="size-4" />
					) : (
						<MicOff aria-hidden="true" className="size-4 text-(--color-stage-text-muted)" />
					)}
					<span className="sr-only">{tile.audioOn ? 'Microphone on' : 'Microphone off'}</span>
					{!compact &&
						(tile.videoOn ? (
							<Video aria-hidden="true" className="size-4" />
						) : (
							<VideoOff aria-hidden="true" className="size-4 text-(--color-stage-text-muted)" />
						))}
					{!compact && <span className="sr-only">{tile.videoOn ? 'Camera on' : 'Camera off'}</span>}
				</span>
			</div>
		</div>
	);
}
