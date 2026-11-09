'use client';

import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {CallStage, type StageStatus} from '@/components/telehealth/call-stage/call-stage';
import {CallStagePortal} from '@/components/telehealth/call-stage/call-stage-portal';
import {useDailyMediaSession} from '@/lib/hooks/use-daily-media-session';
import {recordCallSummary} from '@/lib/telehealth/call-summary';
import {deriveCallState, waitingCopy, type CallState} from '@/lib/telehealth/call-state';
import type {JoinChoices} from '@/lib/telehealth/join-choices';
import {useCallNotices} from '@/lib/telehealth/use-call-notices';
import {useVisitKeepAlive} from '@/lib/telehealth/use-visit-keepalive';
import type {Role} from '@/types/auth/roles';
import type {TelehealthSession} from '@/types/medical/telehealth-session';

type Media = ReturnType<typeof useDailyMediaSession>;

function toStageStatus(
	state: CallState,
	handlers: {
		retry: () => void;
		retryDevices: () => void;
		turnOffCamera: () => void;
		wait: () => void;
	},
): StageStatus {
	const onClick = {
		retry: handlers.retry,
		'retry-devices': handlers.retryDevices,
		'turn-off-camera': handlers.turnOffCamera,
		wait: handlers.wait,
		// Opened by the stage itself, behind the same confirmation as the control bar.
		'end-visit': () => undefined,
	} as const;
	return {
		kind: state.kind,
		text: state.text,
		detail: state.detail,
		actions: state.actions.map((action) => ({id: action.id, label: action.label, onClick: onClick[action.id]})),
	};
}

export function DailyMediaSession({
	sessionId,
	session,
	visitTitle,
	onEnd,
	onLeave,
	onEndedSuspected,
	onVisitClosed,
	isEnding,
	endError,
	canEnd,
	viewerRole,
	joinChoices,
}: {
	joinChoices?: JoinChoices;
	sessionId: string;
	session: TelehealthSession;
	visitTitle: string;
	onEnd: () => void;
	onLeave?: () => void;
	/** Daily dropped us; the caller re-reads the Nest session to see whether the host ended the visit. */
	onEndedSuspected?: () => void;
	/** The heartbeat got 404 or 409: the visit is gone or no longer eligible. */
	onVisitClosed?: () => void;
	isEnding: boolean;
	endError?: string;
	/** `viewerCanEnd` from Nest. Never derived from the role here. */
	canEnd: boolean;
	/** Only picks the "waiting for ..." wording. Never used for authorization. */
	viewerRole?: Role;
}) {
	const media: Media = useDailyMediaSession({
		sessionId,
		enabled: true,
		joinChoices,
		roster: session.participants,
		onEndedSuspected,
	});
	const [leftMedia, setLeftMedia] = useState(false);
	const [leftAcknowledged, setLeftAcknowledged] = useState(false);
	const [lastRemoteName, setLastRemoteName] = useState<string | undefined>();

	// Remember who was here so "X left the call" can name them; a returning participant clears Wait.
	const remote = media.tiles.find((tile) => !tile.isLocal);
	if (remote && remote.name !== lastRemoteName) {
		setLastRemoteName(remote.name);
	}
	if (remote && leftAcknowledged) {
		setLeftAcknowledged(false);
	}

	// Feeds the provider wrap-up (browser-only, in memory).
	useEffect(() => {
		recordCallSummary(sessionId, media.tiles);
	}, [sessionId, media.tiles]);

	const joined =
		media.connectionState === 'waiting_for_participant' ||
		media.connectionState === 'connected' ||
		media.connectionState === 'reconnecting';
	const keepAliveActive = joined && !leftMedia && !isEnding;
	useVisitKeepAlive({sessionId, active: keepAliveActive, onClosed: onVisitClosed});
	const notices = useCallNotices({sessionId, mediaExpiresAt: session.mediaExpiresAt, keepAliveActive});

	const callState = deriveCallState({
		connectionState: media.connectionState,
		failureKind: media.failureKind,
		hasRemote: Boolean(remote),
		hadRemote: lastRemoteName !== undefined,
		lastRemoteName,
		deviceLost: media.deviceLost === true,
		networkLevel: media.networkLevel,
		cameraOn: media.cameraOn,
		leftAcknowledged,
		canEnd,
		viewerRole,
		patientName: session.patientName,
		providerName: session.providerName,
	});
	const status = callState
		? toStageStatus(callState, {
				retry: media.retry,
				retryDevices: media.retry,
				turnOffCamera: media.toggleCamera,
				wait: () => setLeftAcknowledged(true),
			})
		: undefined;

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
				notices={notices}
				waitingText={waitingCopy({viewerRole, patientName: session.patientName, providerName: session.providerName})}
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
