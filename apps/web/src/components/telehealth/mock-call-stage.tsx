'use client';

import {useEffect, useMemo, useState} from 'react';
import {recordCallSummary} from '@/lib/telehealth/call-summary';
import {Button} from '@/components/ui/button';
import {CallStage} from '@/components/telehealth/call-stage/call-stage';
import {CallStagePortal} from '@/components/telehealth/call-stage/call-stage-portal';
import {mediaTileInitials} from '@/lib/telehealth/media-participant';
import type {StageTile} from '@/lib/telehealth/call-participants';
import {DEFAULT_BACKGROUND, type BackgroundChoice} from '@/lib/telehealth/prejoin-backgrounds';
import type {Role} from '@/types/auth/roles';
import type {TelehealthSession} from '@/types/medical/telehealth-session';

export const MOCK_MEDIA_NOTICE = 'Demo placeholder. Not a live video connection.';

/**
 * Mock-mode call stage: the same full-screen stage with the roster from the mock session and no
 * media. Camera and microphone toggles are local state; nothing is sent anywhere.
 */
export function MockCallStage({
	session,
	userRole,
	visitTitle,
	canEnd,
	isEnding,
	endError,
	onEnd,
}: {
	session: TelehealthSession;
	userRole: Role | undefined;
	visitTitle: string;
	canEnd: boolean;
	isEnding: boolean;
	endError?: string;
	onEnd: () => void;
}) {
	const [leftMedia, setLeftMedia] = useState(false);
	const [cameraOn, setCameraOn] = useState(false);
	const [microphoneOn, setMicrophoneOn] = useState(false);
	const [screenShareOn, setScreenShareOn] = useState(false);
	const [background, setBackground] = useState<BackgroundChoice>(DEFAULT_BACKGROUND);

	const tiles = useMemo<StageTile[]>(() => {
		const localEntry = session.participants.find((entry) => entry.role === userRole);
		const entries = session.participants.length > 0 ? session.participants : [];
		const make = (id: string, name: string, role: Role | null, isLocal: boolean): StageTile => ({
			id,
			userId: id,
			isLocal,
			name,
			role,
			initials: mediaTileInitials(name),
			audioOn: isLocal ? microphoneOn : true,
			videoOn: isLocal ? cameraOn : false,
			videoTrack: null,
			network: isLocal ? 'good' : mockNetworkFor(role),
			speaking: !isLocal && role === 'PATIENT',
		});
		const local = localEntry
			? make(localEntry.userId, 'You', localEntry.role, true)
			: make('mock-you', 'You', null, true);
		const remotes = entries
			.filter((entry) => entry !== localEntry)
			.map((entry) => make(entry.userId, entry.displayName, entry.role, false));
		return [local, ...remotes];
	}, [session.participants, userRole, cameraOn, microphoneOn]);

	useEffect(() => {
		recordCallSummary(session.id, tiles);
	}, [session.id, tiles]);

	if (leftMedia) {
		return (
			<div className="space-y-4">
				<div className="rounded-lg border border-gray-200 bg-white p-4" role="status">
					<p className="text-sm text-gray-700">You left the call. The visit is still open.</p>
					<Button type="button" className="mt-3" variant="outline" onClick={() => setLeftMedia(false)}>
						Rejoin call
					</Button>
				</div>
			</div>
		);
	}

	return (
		<CallStagePortal>
			<CallStage
				visitTitle={visitTitle}
				joinedAt={session.joinedAt}
				status={{kind: 'info', text: MOCK_MEDIA_NOTICE}}
				tiles={tiles}
				screenShare={null}
				microphoneOn={microphoneOn}
				cameraOn={cameraOn}
				screenShareOn={screenShareOn}
				controlsEnabled
				canShareScreen
				networkLevel="good"
				devices={{cameras: [], microphones: [], speakers: []}}
				background={background}
				onToggleMicrophone={() => setMicrophoneOn((on) => !on)}
				onToggleCamera={() => setCameraOn((on) => !on)}
				onToggleScreenShare={() => setScreenShareOn((on) => !on)}
				onChooseDevice={() => undefined}
				onSetBackground={setBackground}
				onFlipCamera={() => undefined}
				onLeave={() => setLeftMedia(true)}
				canEnd={canEnd}
				isEnding={isEnding}
				endError={endError}
				onEnd={onEnd}
			/>
		</CallStagePortal>
	);
}

/** One nurse tile shows the weak-network state so the mock covers it. */
function mockNetworkFor(role: Role | null) {
	return role === 'NURSE' ? ('poor' as const) : ('good' as const);
}
