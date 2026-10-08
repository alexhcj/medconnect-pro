'use client';

import {useEffect, useRef} from 'react';
import {Button} from '@/components/ui/button';
import {MediaConnectionStatus, MEDIA_CONNECTION_COPY} from '@/components/telehealth/media-connection-status';
import {useDailyMediaSession} from '@/lib/hooks/use-daily-media-session';
import {
	localParticipantDisplayName,
	mediaTileInitials,
	remoteParticipantFallbackName,
} from '@/lib/telehealth/media-participant';
import {cn} from '@/lib/utils/utils';
import type {Role} from '@/types/auth/roles';
import type {TelehealthSession} from '@/types/medical/telehealth-session';

function MediaTile({
	nameplate,
	track,
	placeholder,
	active,
	muted,
}: {
	nameplate: string;
	track: MediaStreamTrack | null;
	placeholder: string;
	active: boolean;
	muted?: boolean;
}) {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		const element = videoRef.current;
		if (!element) {
			return;
		}
		if (track) {
			element.srcObject = new MediaStream([track]);
			void element.play().catch(() => undefined);
			return () => {
				element.srcObject = null;
			};
		}
		element.srcObject = null;
		return undefined;
	}, [track]);

	return (
		<div
			className={cn(
				'relative flex min-h-40 flex-col justify-between overflow-hidden rounded-lg border p-3',
				active ? 'border-brand bg-brand-subtle' : 'border-gray-200 bg-gray-100',
			)}
		>
			{track ? (
				<video
					ref={videoRef}
					className="absolute inset-0 h-full w-full object-cover"
					autoPlay
					playsInline
					muted={muted}
				/>
			) : (
				<p className="text-center text-sm font-medium text-brand">{placeholder}</p>
			)}
			<div className="relative z-10 mt-auto inline-flex w-fit items-center gap-2 rounded bg-surface px-2 py-1">
				<span className="inline-block size-2 rounded-full bg-success" aria-hidden />
				<span className="text-xs text-foreground">{nameplate}</span>
			</div>
		</div>
	);
}

function helperText(options: {
	connectionState: ReturnType<typeof useDailyMediaSession>['connectionState'];
	cameraOn: boolean;
	microphoneOn: boolean;
}): string {
	if (options.connectionState === 'joining') {
		return 'Connecting camera and microphone…';
	}
	if (options.connectionState === 'not_configured') {
		return 'This demo environment does not have live Daily media configured.';
	}
	if (options.connectionState === 'failed') {
		return 'Check your connection and try again. You can still end the session.';
	}
	if (!options.cameraOn && !options.microphoneOn) {
		return 'Microphone is off. Camera is off.';
	}
	return `Microphone is ${options.microphoneOn ? 'on' : 'off'}.`;
}

function tilePlaceholder(options: {
	connectionState: ReturnType<typeof useDailyMediaSession>['connectionState'];
	cameraOffInitials?: string;
	waiting?: boolean;
	screenShare?: boolean;
}): string {
	if (options.connectionState === 'joining' || options.connectionState === 'reconnecting') {
		return options.connectionState === 'joining' ? 'Connecting…' : 'Reconnecting…';
	}
	if (options.connectionState === 'not_configured') {
		return 'Live media unavailable';
	}
	if (options.connectionState === 'failed') {
		return 'Unable to connect';
	}
	if (options.screenShare) {
		return 'Screen share';
	}
	if (options.waiting) {
		return MEDIA_CONNECTION_COPY.waiting_for_participant;
	}
	if (options.cameraOffInitials) {
		return options.cameraOffInitials;
	}
	return 'Live video';
}

export function DailyMediaSession({
	sessionId,
	session,
	userRole,
	onEnd,
	isEnding,
	endError,
}: {
	sessionId: string;
	session: TelehealthSession;
	userRole: Role | undefined;
	onEnd: () => void;
	isEnding: boolean;
	endError?: string;
}) {
	const media = useDailyMediaSession({sessionId, enabled: true});
	const localName = localParticipantDisplayName(session, userRole);
	const remoteFallback = remoteParticipantFallbackName(session, userRole);
	const remoteName =
		media.connectionState === 'connected' || media.connectionState === 'reconnecting'
			? media.remoteParticipantName || remoteFallback
			: 'Participant';
	const showingScreenShare = Boolean(media.screenShareTrack);
	const localPlaceholder = tilePlaceholder({
		connectionState: media.connectionState,
		cameraOffInitials: media.cameraOn ? undefined : mediaTileInitials(localName),
	});
	const remotePlaceholder = tilePlaceholder({
		connectionState: media.connectionState,
		waiting: media.connectionState === 'waiting_for_participant',
		screenShare: showingScreenShare,
	});

	return (
		<div className="space-y-4">
			<MediaConnectionStatus state={media.connectionState} />
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<MediaTile
					nameplate="You"
					track={media.cameraOn ? media.localVideoTrack : null}
					placeholder={localPlaceholder}
					active={media.cameraOn && media.connectionState !== 'not_configured' && media.connectionState !== 'failed'}
					muted
				/>
				<MediaTile
					nameplate={showingScreenShare ? 'Shared screen' : remoteName}
					track={showingScreenShare ? media.screenShareTrack : media.remoteVideoTrack}
					placeholder={remotePlaceholder}
					active={
						(showingScreenShare || Boolean(media.remoteVideoTrack)) &&
						media.connectionState !== 'not_configured' &&
						media.connectionState !== 'failed'
					}
				/>
			</div>
			<div className="flex flex-wrap gap-2" role="group" aria-label="Media controls">
				<Button
					type="button"
					variant={media.cameraOn ? 'default' : 'outline'}
					aria-pressed={media.cameraOn}
					disabled={!media.controlsEnabled}
					onClick={media.toggleCamera}
				>
					Camera
				</Button>
				<Button
					type="button"
					variant={media.microphoneOn ? 'default' : 'outline'}
					aria-pressed={media.microphoneOn}
					disabled={!media.controlsEnabled}
					onClick={media.toggleMicrophone}
				>
					Microphone
				</Button>
				<Button
					type="button"
					variant={media.screenShareOn ? 'default' : 'outline'}
					aria-pressed={media.screenShareOn}
					disabled={!media.controlsEnabled}
					onClick={media.toggleScreenShare}
				>
					Screen share
				</Button>
			</div>
			<p className="text-sm text-gray-600">{helperText(media)}</p>
			{media.connectionState === 'failed' && (
				<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
					<p className="text-sm text-gray-700">Live media is currently unavailable.</p>
					<Button type="button" className="mt-3" variant="outline" onClick={media.retry}>
						Retry
					</Button>
				</div>
			)}
			{endError && (
				<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
					<p className="text-sm text-gray-700">{endError}</p>
				</div>
			)}
			<Button
				type="button"
				variant="destructive"
				isLoading={isEnding}
				onClick={() => {
					void media.leaveAndDestroy().finally(onEnd);
				}}
			>
				End session
			</Button>
		</div>
	);
}
