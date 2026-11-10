'use client';

import {useEffect, useRef, useState} from 'react';
import {Monitor} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {ControlBar} from '@/components/telehealth/call-stage/control-bar';
import {DevicesModal, type DevicesTab} from '@/components/telehealth/call-stage/devices-modal';
import {EndVisitDialog} from '@/components/telehealth/call-stage/end-visit-dialog';
import {MoreSheet} from '@/components/telehealth/call-stage/more-sheet';
import {ParticipantTile, TileVideo} from '@/components/telehealth/call-stage/participant-tile';
import {ParticipantsPanel} from '@/components/telehealth/call-stage/participants-panel';
import {EncryptionNote, StageHeader} from '@/components/telehealth/call-stage/stage-header';
import {useCallShortcuts} from '@/components/telehealth/call-stage/use-call-shortcuts';
import {useVisitTimer} from '@/components/telehealth/call-stage/use-visit-timer';
import type {CallDevices} from '@/lib/hooks/use-daily-media-session';
import type {NetworkLevel, ScreenShareView, StageTile} from '@/lib/telehealth/call-participants';
import type {BackgroundChoice} from '@/lib/telehealth/prejoin-backgrounds';
import {cn} from '@/lib/utils/utils';

export interface StageStatusAction {
	id: string;
	label: string;
	onClick: () => void;
}

export interface StageStatus {
	kind: 'info' | 'error';
	text: string;
	/** Second line under the text (for example "The visit is still open."). */
	detail?: string;
	onRetry?: () => void;
	/** Next steps for this state. Red is reserved for End visit. */
	actions?: StageStatusAction[];
}

/** A polite, non-modal notice under the status. It never takes focus (FE-064). */
export interface StageNotice {
	id: string;
	text: string;
	dismissLabel?: string;
	onDismiss?: () => void;
}

export interface CallStageProps {
	visitTitle: string;
	/** Session `joinedAt`; the timer counts from here. */
	joinedAt?: string;
	status?: StageStatus;
	notices?: StageNotice[];
	/** What the empty stage says while nobody else is here. */
	waitingText?: string;
	tiles: StageTile[];
	screenShare: ScreenShareView | null;
	microphoneOn: boolean;
	cameraOn: boolean;
	screenShareOn: boolean;
	controlsEnabled: boolean;
	canShareScreen: boolean;
	networkLevel: NetworkLevel;
	devices: CallDevices;
	background: BackgroundChoice;
	/** FE-065: the local video is the demo persona, so the Camera select is replaced by a note. */
	personaActive?: boolean;
	onToggleMicrophone: () => void;
	onToggleCamera: () => void;
	onToggleScreenShare: () => void;
	onChooseDevice: (kind: 'camera' | 'microphone' | 'speaker', deviceId: string) => void;
	onSetBackground: (choice: BackgroundChoice) => void;
	onFlipCamera: () => void;
	/** Leave call: client only, reversible, everyone. */
	onLeave: () => void;
	/** From `viewerCanEnd`. When false there is no End visit anywhere on the stage. */
	canEnd: boolean;
	isEnding: boolean;
	endError?: string;
	onEnd: () => void;
}

function WaitingTile({text}: {text: string}) {
	return (
		<div
			className="flex min-h-48 flex-1 items-center justify-center rounded-xl border border-(--color-stage-border) bg-(--color-stage-surface) p-6 text-center"
			data-waiting="true"
		>
			<p className="text-base text-(--color-stage-text-muted)">{text}</p>
		</div>
	);
}

/**
 * Full-screen dark call stage (FE-063). Presentational: the media hook and the visit data are
 * wired in `DailyMediaSession` (live) and the session shell (mock). 1–3 participants plus an
 * optional screen share; self view is a picture-in-picture, or a strip tile while sharing.
 */
export function CallStage(props: CallStageProps) {
	const elapsed = useVisitTimer(props.joinedAt);
	const rootRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		// The page behind is inert; start keyboard focus on the call, not on the old Join button.
		rootRef.current?.focus();
	}, []);
	const [devicesOpen, setDevicesOpen] = useState(false);
	const [devicesTab, setDevicesTab] = useState<DevicesTab>('video');
	const [moreOpen, setMoreOpen] = useState(false);
	const [participantsOpen, setParticipantsOpen] = useState(false);
	const [endOpen, setEndOpen] = useState(false);

	useCallShortcuts({
		enabled: props.controlsEnabled,
		onToggleMicrophone: props.onToggleMicrophone,
		onToggleCamera: props.onToggleCamera,
	});

	const openDevices = (tab: DevicesTab) => {
		setDevicesTab(tab);
		setDevicesOpen(true);
	};

	const self = props.tiles.find((tile) => tile.isLocal);
	const remotes = props.tiles.filter((tile) => !tile.isLocal);
	const sharing = props.screenShare;

	return (
		<div
			ref={rootRef}
			tabIndex={-1}
			role="region"
			aria-label="Video visit"
			data-call-stage="true"
			className="fixed inset-0 z-50 flex flex-col bg-(--color-stage-bg) text-(--color-stage-text) focus:outline-none"
		>
			<StageHeader title={props.visitTitle} elapsed={elapsed} networkLevel={props.networkLevel} />

			{props.status && (
				<div
					role={props.status.kind === 'error' ? 'alert' : 'status'}
					aria-live={props.status.kind === 'error' ? undefined : 'polite'}
					className={cn(
						'flex flex-wrap items-center gap-3 border-b px-4 py-2 text-sm sm:px-7',
						props.status.kind === 'error'
							? 'border-red-400/60 bg-red-950/50 text-red-100'
							: 'border-(--color-stage-border) bg-(--color-stage-surface) text-(--color-stage-text)',
					)}
				>
					<span>
						{props.status.text}
						{props.status.detail && (
							<span className="ml-2 text-(--color-stage-text-muted)">{props.status.detail}</span>
						)}
					</span>
					{props.status.actions?.map((action) =>
						action.id === 'end-visit' ? (
							// Same confirmation as the control bar; red stays reserved for End visit.
							props.canEnd && (
								<Button
									key={action.id}
									type="button"
									variant="destructive"
									size="sm"
									onClick={() => setEndOpen(true)}
								>
									{action.label}
								</Button>
							)
						) : (
							<Button
								key={action.id}
								type="button"
								variant="outline"
								size="sm"
								onClick={action.onClick}
								className="border-white bg-white text-gray-900 hover:bg-gray-100"
							>
								{action.label}
							</Button>
						),
					)}
					{props.status.onRetry && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={props.status.onRetry}
							className="border-white bg-white text-gray-900 hover:bg-gray-100"
						>
							Retry
						</Button>
					)}
				</div>
			)}

			{props.notices?.map((notice) => (
				<div
					key={notice.id}
					role="status"
					aria-live="polite"
					data-notice={notice.id}
					className="flex flex-wrap items-center gap-3 border-b border-(--color-stage-border) bg-(--color-stage-surface-raised) px-4 py-2 text-sm text-(--color-stage-text) sm:px-7"
				>
					<span>{notice.text}</span>
					{notice.onDismiss && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={notice.onDismiss}
							className="border-white bg-white text-gray-900 hover:bg-gray-100"
						>
							{notice.dismissLabel ?? 'Got it'}
						</Button>
					)}
				</div>
			))}

			{props.endError && (
				<p role="alert" className="border-b border-red-400/60 bg-red-950/50 px-4 py-2 text-sm text-red-100 sm:px-7">
					{props.endError}
				</p>
			)}

			<div className="flex min-h-0 flex-1">
				<div className="relative flex min-h-0 min-w-0 flex-1 flex-col p-3 sm:p-6">
					{sharing ? (
						<div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
							<section
								aria-label={`${sharing.ownerName} is sharing a screen`}
								className="flex min-h-0 min-w-0 flex-1 flex-col gap-2"
							>
								<p className="flex items-center gap-2 text-sm font-medium">
									<Monitor aria-hidden="true" className="size-4 text-(--color-focus-brand)" />
									{sharing.isLocal ? 'You are sharing your screen' : `${sharing.ownerName} is sharing`}
								</p>
								<div className="relative min-h-48 flex-1 overflow-hidden rounded-xl border border-(--color-stage-border) bg-black">
									<TileVideo track={sharing.track} muted className="object-contain" />
								</div>
							</section>
							<ul
								aria-label="Participants"
								className="flex gap-3 overflow-auto lg:w-56 lg:flex-col lg:overflow-y-auto"
							>
								{props.tiles.map((tile) => (
									<li key={tile.id} className="h-36 w-56 shrink-0 lg:h-44 lg:w-auto">
										<ParticipantTile tile={tile} variant="strip" className="size-full" />
									</li>
								))}
							</ul>
						</div>
					) : (
						<>
							{/* Scrolls when a status row or notice squeezes it, so keyboard users must be able to reach it. */}
							<div
								role="region"
								aria-label="Video tiles"
								tabIndex={0}
								className={cn(
									'grid min-h-0 flex-1 auto-rows-[minmax(10rem,1fr)] gap-3 overflow-y-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-stage-text)',
									remotes.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1',
								)}
							>
								{remotes.length === 0 ? (
									<WaitingTile text={props.waitingText ?? 'Waiting for the other participant'} />
								) : (
									remotes.map((tile) => <ParticipantTile key={tile.id} tile={tile} className="min-h-40" />)
								)}
							</div>
							{self && (
								<ParticipantTile
									tile={self}
									variant="pip"
									className="absolute right-5 top-5 h-32 w-24 shadow-lg sm:bottom-8 sm:right-8 sm:top-auto sm:h-28 sm:w-44"
								/>
							)}
						</>
					)}
				</div>

				{participantsOpen && (
					<ParticipantsPanel tiles={props.tiles} onClose={() => setParticipantsOpen(false)} />
				)}
			</div>

			<EncryptionNote className="justify-center pb-2" />
			<ControlBar
				microphoneOn={props.microphoneOn}
				cameraOn={props.cameraOn}
				screenShareOn={props.screenShareOn}
				participantsOpen={participantsOpen}
				controlsEnabled={props.controlsEnabled}
				canShareScreen={props.canShareScreen}
				canEnd={props.canEnd}
				isEnding={props.isEnding}
				onToggleMicrophone={props.onToggleMicrophone}
				onToggleCamera={props.onToggleCamera}
				onToggleScreenShare={props.onToggleScreenShare}
				onOpenBackground={() => openDevices('background')}
				onOpenDevices={() => openDevices('video')}
				onToggleParticipants={() => setParticipantsOpen((open) => !open)}
				onFlipCamera={props.onFlipCamera}
				onOpenMore={() => setMoreOpen(true)}
				onLeave={props.onLeave}
				onRequestEnd={() => setEndOpen(true)}
			/>

			<MoreSheet
				open={moreOpen}
				onClose={() => setMoreOpen(false)}
				participantCount={props.tiles.length}
				canEnd={props.canEnd}
				onOpenDevices={() => openDevices('video')}
				onOpenParticipants={() => setParticipantsOpen(true)}
				onOpenBackground={() => openDevices('background')}
				onRequestEnd={() => setEndOpen(true)}
			/>
			<DevicesModal
				open={devicesOpen}
				onClose={() => setDevicesOpen(false)}
				tab={devicesTab}
				onTabChange={setDevicesTab}
				devices={props.devices}
				background={props.background}
				personaActive={props.personaActive}
				onChooseDevice={props.onChooseDevice}
				onSetBackground={props.onSetBackground}
				disabled={!props.controlsEnabled}
			/>
			{props.canEnd && (
				<EndVisitDialog
					open={endOpen}
					onClose={() => setEndOpen(false)}
					onConfirm={props.onEnd}
					isEnding={props.isEnding}
				/>
			)}
		</div>
	);
}
