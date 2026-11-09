'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {CallStage, type StageStatus} from '@/components/telehealth/call-stage/call-stage';
import {CallStagePortal} from '@/components/telehealth/call-stage/call-stage-portal';
import {MEDIA_CONNECTION_COPY} from '@/components/telehealth/media-connection-status';
import {useDailyMediaSession} from '@/lib/hooks/use-daily-media-session';
import type {JoinChoices} from '@/lib/telehealth/join-choices';
import {DAILY_MEDIA_FAILURE_COPY} from '@/lib/telehealth/media-failure';
import type {TelehealthSession} from '@/types/medical/telehealth-session';

type MediaSnapshot = Pick<ReturnType<typeof useDailyMediaSession>, 'connectionState' | 'failureKind' | 'retry'>;

function stageStatus(media: MediaSnapshot): StageStatus | undefined {
	switch (media.connectionState) {
		case 'joining':
			return {kind: 'info', text: MEDIA_CONNECTION_COPY.joining};
		case 'waiting_for_participant':
			return {kind: 'info', text: MEDIA_CONNECTION_COPY.waiting_for_participant};
		case 'reconnecting':
			return {kind: 'info', text: MEDIA_CONNECTION_COPY.reconnecting};
		case 'not_configured':
			return {kind: 'error', text: MEDIA_CONNECTION_COPY.not_configured};
		case 'failed':
			return {
				kind: 'error',
				text: DAILY_MEDIA_FAILURE_COPY[media.failureKind === 'none' ? 'generic' : media.failureKind],
				onRetry: media.retry,
			};
		default:
			return undefined;
	}
}

export function DailyMediaSession({
	sessionId,
	session,
	visitTitle,
	onEnd,
	onLeave,
	isEnding,
	endError,
	canEnd,
	joinChoices,
}: {
	joinChoices?: JoinChoices;
	sessionId: string;
	session: TelehealthSession;
	visitTitle: string;
	onEnd: () => void;
	onLeave?: () => void;
	isEnding: boolean;
	endError?: string;
	/** `viewerCanEnd` from Nest. Never derived from the role here. */
	canEnd: boolean;
}) {
	const media = useDailyMediaSession({sessionId, enabled: true, joinChoices, roster: session.participants});
	const [leftMedia, setLeftMedia] = useState(false);
	const status = stageStatus(media);

	if (leftMedia) {
		return (
			<div className="space-y-4">
				<div className="rounded-lg border border-gray-200 bg-white p-4" role="status">
					<p className="text-sm text-gray-700">You left the call. The visit is still open.</p>
					<Button
						type="button"
						className="mt-3"
						variant="outline"
						onClick={() => {
							setLeftMedia(false);
							media.retry();
						}}
					>
						Rejoin call
					</Button>
				</div>
				{endError && (
					<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
						<p className="text-sm text-gray-700">{endError}</p>
					</div>
				)}
				{canEnd && (
					<Button type="button" variant="destructive" isLoading={isEnding} onClick={onEnd}>
						End visit
					</Button>
				)}
			</div>
		);
	}

	return (
		<CallStagePortal>
			<CallStage
				visitTitle={visitTitle}
				joinedAt={session.joinedAt}
				status={status}
				tiles={media.tiles}
				screenShare={media.screenShare}
				microphoneOn={media.microphoneOn}
				cameraOn={media.cameraOn}
				screenShareOn={media.screenShareOn}
				controlsEnabled={media.controlsEnabled}
				canShareScreen={media.canShareScreen}
				networkLevel={media.networkLevel}
				devices={media.devices}
				background={media.background}
				onToggleMicrophone={media.toggleMicrophone}
				onToggleCamera={media.toggleCamera}
				onToggleScreenShare={media.toggleScreenShare}
				onChooseDevice={(kind, id) => void media.chooseDevice(kind, id)}
				onSetBackground={(choice) => void media.setBackground(choice)}
				onFlipCamera={() => void media.flipCamera()}
				onLeave={() => {
					void media.leaveAndDestroy().then(() => {
						setLeftMedia(true);
						onLeave?.();
					});
				}}
				canEnd={canEnd}
				isEnding={isEnding}
				endError={endError}
				onEnd={() => {
					void media.leaveAndDestroy().finally(onEnd);
				}}
			/>
		</CallStagePortal>
	);
}
