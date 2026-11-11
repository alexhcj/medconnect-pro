'use client';

import {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import Link from 'next/link';
import {Disclosure, DisclosureButton, DisclosurePanel} from '@headlessui/react';
import {ChevronDown, Headphones, Info, ShieldCheck, Volume1, Volume2} from 'lucide-react';
import {
	BackgroundPicker,
	CameraPreview,
	ConnectionChecks,
	LevelMeter,
	PREJOIN_ENCRYPTION_NOTE,
	PreviewProblem,
	ReadinessStatus,
} from '@/components/telehealth/green-room-parts';
import {
	CameraSourcePicker,
	DemoPersonaBanner,
	PERSONA_FALLBACK_NOTICE,
	PERSONA_PRIVACY_BODY_ON,
	PERSONA_PRIVACY_TITLE_ON,
	PersonaPreview,
	PersonaStrip,
	type CameraSource,
} from '@/components/telehealth/persona-camera-parts';
import {Button} from '@/components/ui/button';
import {SelectField, type SelectOption} from '@/components/ui/select-field';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {showDemoAccounts} from '@/lib/auth/demo-accounts';
import {usePrejoinMedia, type PrejoinDeviceOption} from '@/lib/hooks/use-prejoin-media';
import type {DemoPersonaKey} from '@/lib/telehealth/demo-personas';
import type {JoinChoices} from '@/lib/telehealth/join-choices';
import {startPersonaCamera, type PersonaCameraHandle} from '@/lib/telehealth/persona-camera';
import type {BackgroundChoice} from '@/lib/telehealth/prejoin-backgrounds';
import {buildPrejoinChecks} from '@/lib/telehealth/prejoin-checks';
import {primaryJoinAction, type PrejoinPhase} from '@/lib/telehealth/prejoin-devices';
import {playTestTone, type TestToneHandle} from '@/lib/telehealth/test-tone';

export interface GreenRoomProps {
	/** The appointment reason (visit notes). Never the diagnosis list: front-desk roles see titles. */
	visitTitle: string;
	/** Already formatted, for example "Today, 2:30 PM · Dr. Jordan Ellis with Avery Quinn". */
	scheduleText: string;
	/** Two letters shown on the mock preview, for example "JE". */
	initials: string;
	onJoin: (choices: JoinChoices) => void;
	isJoining: boolean;
	errorMessage?: string;
	backHref?: string;
	/**
	 * FE-065: the caller's own demo persona key from Nest. The persona option exists only in demo
	 * builds (`NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true`) and only when this is set.
	 */
	personaKey?: DemoPersonaKey | null;
	/** The caller's name from Nest (roster). The persona never changes it. */
	displayName?: string;
	/**
	 * FE-067: set when the visit is already live and this participant is a later joiner. Wording only;
	 * it never decides access. Who is in the call by name needs Nest presence (known limitation).
	 */
	inProgressText?: string;
}

function prefersReducedMotion(): boolean {
	return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;
}

const PHASE_ANNOUNCEMENT: Record<PrejoinPhase, string> = {
	checking: 'Checking camera and microphone.',
	ready: 'Camera and microphone are ready.',
	blocked: 'Camera and microphone are blocked.',
	no_camera: 'No camera found. You can join with audio only.',
};

/**
 * Mock mode only: `?prejoin=checking|blocked|no_camera` shows that state so the screens and the
 * Playwright mock spec are deterministic. Live mode never reads it.
 */
function mockPhaseFromLocation(): PrejoinPhase | undefined {
	if (typeof window === 'undefined') {
		return undefined;
	}
	const value = new URLSearchParams(window.location.search).get('prejoin');
	return value === 'checking' || value === 'blocked' || value === 'no_camera' ? value : undefined;
}

const DESKTOP_QUERY ='(min-width: 1024px)';

/** Devices are always open on desktop and a collapsed disclosure on mobile (one copy in the DOM). */
function useIsDesktop(): boolean {
	return useSyncExternalStore(
		(onChange) => {
			if (typeof window.matchMedia !== 'function') {
				return () => undefined;
			}
			const list = window.matchMedia(DESKTOP_QUERY);
			list.addEventListener('change', onChange);
			return () => list.removeEventListener('change', onChange);
		},
		// Without matchMedia (jsdom) show the desktop layout, where nothing is collapsed.
		() => (typeof window.matchMedia === 'function' ? window.matchMedia(DESKTOP_QUERY).matches : true),
		() => false,
	);
}

function deviceOptions(devices: PrejoinDeviceOption[]): SelectOption[] {
	return devices.map((device) => ({value: device.deviceId, label: device.label}));
}

function levelText(phase: PrejoinPhase, lit: number): string {
	if (phase === 'checking') {
		return 'Checking microphone…';
	}
	if (phase === 'blocked') {
		return 'Microphone blocked';
	}
	return lit > 0 ? 'Microphone is picking up sound' : 'Speak to test your microphone';
}

function guidanceText(phase: PrejoinPhase): string {
	if (phase === 'ready') {
		return 'Your camera and microphone are on. This is a preview. You have not joined the visit yet.';
	}
	if (phase === 'checking') {
		return 'Allow access when your browser asks. This usually takes a few seconds.';
	}
	if (phase === 'blocked') {
		return 'You can still join. The provider will see your initials.';
	}
	return 'Connect a camera and select Check again, or join with audio only.';
}

export function GreenRoom({
	visitTitle,
	scheduleText,
	initials,
	onJoin,
	isJoining,
	errorMessage,
	backHref = '/dashboard/appointments',
	personaKey = null,
	displayName = 'You',
	inProgressText,
}: GreenRoomProps) {
	const mock = isMockMode();
	const [mockPhase] = useState(() => (mock ? mockPhaseFromLocation() : undefined));
	const media = usePrejoinMedia({mock, mockPhase});
	const isDesktop = useIsDesktop();
	const {phase, retry} = media;
	const [playing, setPlaying] = useState(false);
	const toneRef = useRef<TestToneHandle | null>(null);
	const releasedRef = useRef(false);

	// The preview is released before joining. If the join fails the visitor stays here, so bring it back.
	useEffect(() => {
		if (errorMessage && releasedRef.current) {
			releasedRef.current = false;
			retry();
		}
	}, [errorMessage, retry]);

	useEffect(() => () => toneRef.current?.stop(), []);

	// ---- FE-065 demo persona camera. Browser-only; nothing here is sent to Nest. ----
	const personaAvailable = showDemoAccounts() && personaKey !== null;
	const [source, setSource] = useState<CameraSource>('camera');
	const [personaStream, setPersonaStream] = useState<MediaStream | null>(null);
	const [personaNotice, setPersonaNotice] = useState<string | null>(null);
	const [personaBackground, setPersonaBackground] = useState<BackgroundChoice>({kind: 'none'});
	const personaRef = useRef<PersonaCameraHandle | null>(null);
	const personaBackgroundRef = useRef<BackgroundChoice>(personaBackground);
	const personaTransferredRef = useRef(false);
	const personaOn = personaAvailable && source === 'persona';
	const personaReady = personaOn && personaStream !== null;
	const {setCameraEnabled} = media;

	useEffect(() => {
		if (!personaOn || !personaKey) {
			return;
		}
		let cancelled = false;
		personaBackgroundRef.current = media.background;
		setPersonaBackground(media.background);
		void setCameraEnabled(false);
		startPersonaCamera({
			personaKey,
			background: media.background,
			microphoneId: media.selection.microphoneId,
			reducedMotion: prefersReducedMotion(),
		})
			.then((handle) => {
				if (cancelled) {
					handle.stop();
					return;
				}
				personaRef.current = handle;
				setPersonaStream(handle.stream);
			})
			.catch(() => {
				if (cancelled) {
					return;
				}
				// Canvas capture or the art is unavailable: fall back to the real camera and say so.
				setPersonaNotice(PERSONA_FALLBACK_NOTICE);
				setSource('camera');
			});
		return () => {
			cancelled = true;
			const handle = personaRef.current;
			personaRef.current = null;
			setPersonaStream(null);
			if (handle && !personaTransferredRef.current) {
				handle.stop();
			}
			void setCameraEnabled(true);
		};
		// The persona restarts only when it is turned on or off. Background and microphone changes are applied live.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [personaOn, personaKey, setCameraEnabled]);

	// A failed join keeps this screen, so it owns the persona again until the next join.
	useEffect(() => {
		if (errorMessage) {
			personaTransferredRef.current = false;
		}
	}, [errorMessage]);

	useEffect(() => {
		if (!personaOn || typeof window.matchMedia !== 'function') {
			return;
		}
		const list = window.matchMedia('(prefers-reduced-motion: reduce)');
		const apply = () => personaRef.current?.setReducedMotion(list.matches);
		list.addEventListener('change', apply);
		return () => list.removeEventListener('change', apply);
	}, [personaOn]);

	const action = personaOn
		? {label: 'Join visit', audioOnly: false, disabled: !personaReady}
		: primaryJoinAction(phase);
	const checks = buildPrejoinChecks({browserSupported: media.browserSupported, phase});
	const problem = phase !== 'ready' && !personaOn;
	const devicesUnavailable = phase === 'blocked';

	function handleBackground(choice: BackgroundChoice) {
		if (personaOn) {
			personaBackgroundRef.current = choice;
			setPersonaBackground(choice);
			void personaRef.current?.setBackground(choice);
			return;
		}
		void media.setBackground(choice);
	}

	async function handleJoin(audioOnly: boolean) {
		const persona = personaOn && !audioOnly ? personaRef.current : null;
		const choices: JoinChoices = persona
			? {
					...media.getChoices(false),
					background: personaBackgroundRef.current,
					videoSource: persona.track,
					personaCamera: persona,
				}
			: media.getChoices(audioOnly);
		if (persona) {
			// The shell owns the persona from here, so it outlives this screen.
			personaTransferredRef.current = true;
		}
		releasedRef.current = true;
		toneRef.current?.stop();
		await media.release();
		onJoin(choices);
	}

	function handlePlayTone() {
		toneRef.current?.stop();
		const handle = playTestTone({outputDeviceId: mock ? undefined : media.selection.speakerId});
		toneRef.current = handle;
		setPlaying(true);
		void handle.done.then(() => {
			if (toneRef.current === handle) {
				setPlaying(false);
			}
		});
	}

	const cameraOptions: SelectOption[] = devicesUnavailable
		? [{value: '', label: 'Blocked by browser', disabled: true}]
		: phase === 'no_camera' || media.cameras.length === 0
			? [{value: '', label: phase === 'checking' ? 'Checking…' : 'No camera found', disabled: true}]
			: deviceOptions(media.cameras);
	const microphoneOptions: SelectOption[] = devicesUnavailable
		? [{value: '', label: 'Blocked by browser', disabled: true}]
		: media.microphones.length === 0
			? [{value: '', label: phase === 'checking' ? 'Checking…' : 'No microphone found', disabled: true}]
			: deviceOptions(media.microphones);
	const speakerOptions: SelectOption[] =
		media.speakers.length === 0
			? [{value: '', label: 'System default', disabled: true}]
			: deviceOptions(media.speakers);

	const devicePanel = (
		<div className="space-y-3">
			{personaAvailable && personaKey && (
				<div className="space-y-4 border-b border-border pb-4">
					<CameraSourcePicker value={source} onChange={(next) => {
						setPersonaNotice(null);
						setSource(next);
					}} />
					{personaOn && <PersonaStrip activeKey={personaKey} />}
				</div>
			)}
			{!personaOn && (
				<SelectField
					size="large"
					label="Camera"
					value={cameraOptions.length === 1 && cameraOptions[0].disabled ? '' : (media.selection.cameraId ?? '')}
					options={cameraOptions}
					disabled={devicesUnavailable || phase === 'no_camera' || phase === 'checking' || media.cameras.length === 0}
					onChange={(value) => void media.selectCamera(value)}
				/>
			)}
			<SelectField
				size="large"
				label="Microphone"
				value={microphoneOptions.length === 1 && microphoneOptions[0].disabled ? '' : (media.selection.microphoneId ?? '')}
				options={microphoneOptions}
				disabled={devicesUnavailable || phase === 'checking' || media.microphones.length === 0}
				onChange={(value) => void media.selectMicrophone(value)}
			/>
			<div className="flex items-end gap-2">
				<SelectField
					size="large"
					className="min-w-0 flex-1"
					label="Speaker"
					value={speakerOptions.length === 1 && speakerOptions[0].disabled ? '' : (media.selection.speakerId ?? '')}
					options={speakerOptions}
					disabled={media.speakers.length === 0}
					onChange={(value) => void media.selectSpeaker(value)}
				/>
				<Button type="button" variant="outline" size="lg" className="shrink-0 px-4" onClick={handlePlayTone}>
					<Volume2 aria-hidden="true" className="mr-2 size-4" />
					{playing ? 'Playing test sound…' : 'Play test sound'}
				</Button>
			</div>
			<div className="space-y-2 pt-1">
				<p className="text-sm font-medium text-foreground-label">Background</p>
				<BackgroundPicker
					value={personaOn ? personaBackground : media.background}
					onChange={handleBackground}
					disabled={problem}
				/>
			</div>
		</div>
	);

	return (
		<section aria-labelledby="green-room-title" className="space-y-6">
			<header className="space-y-1">
				<p className="text-sm font-medium text-brand">Pre-join check</p>
				<h2 id="green-room-title" className="text-2xl font-bold text-foreground">
					{visitTitle}
				</h2>
				<p className="text-sm text-foreground-secondary">{scheduleText}</p>
				{inProgressText && (
					<p className="flex items-center gap-2 text-sm font-medium text-foreground-secondary">
						<span aria-hidden="true" className="size-2 rounded-full bg-success" />
						{inProgressText}
					</p>
				)}
			</header>

			{personaAvailable && <DemoPersonaBanner />}

			<p className="sr-only" aria-live="polite">
				{inProgressText ? `${inProgressText}. ` : ''}
				{PHASE_ANNOUNCEMENT[phase]}
				{playing ? ' Playing test sound.' : ''}
				{media.notice ? ` ${media.notice}` : ''}
				{personaAvailable ? (personaOn ? ' Demo persona camera on.' : ' My camera selected.') : ''}
				{personaNotice ? ` ${personaNotice}` : ''}
			</p>

			{personaNotice && (
				<p className="flex items-start gap-2 rounded-md border border-warning bg-warning-subtle p-3 text-sm text-foreground" role="status">
					<Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
					{personaNotice}
				</p>
			)}

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
				<div className="space-y-4">
					<div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-surface max-md:aspect-[3/4] max-md:max-h-[60vh]">
						{personaOn && personaKey ? (
							<PersonaPreview stream={personaStream} personaKey={personaKey} displayName={displayName} />
						) : problem ? (
							<PreviewProblem
								phase={phase as Exclude<PrejoinPhase, 'ready'>}
								onRetry={retry}
								onAudioOnly={() => void handleJoin(true)}
							/>
						) : (
							<CameraPreview track={media.videoTrack} label={initials} background={media.background} />
						)}
					</div>

					<div className="rounded-lg border border-border bg-surface p-4">
						<LevelMeter lit={phase === 'checking' || phase === 'blocked' ? 0 : media.litSegments} statusText={levelText(phase, media.litSegments)} />
					</div>

					{personaOn ? (
						<div className="rounded-lg border border-border bg-surface p-4">
							<h3 className="text-base font-semibold text-foreground">{PERSONA_PRIVACY_TITLE_ON}</h3>
							<p className="mt-1 text-sm text-foreground-secondary">{PERSONA_PRIVACY_BODY_ON}</p>
						</div>
					) : (
						<p className="flex items-start gap-2 text-sm text-foreground-secondary">
							<Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
							{guidanceText(phase)}
						</p>
					)}
					{media.notice && (
						<p className="rounded-md border border-warning bg-warning-subtle p-3 text-sm text-foreground" role="status">
							{media.notice}
						</p>
					)}

					<div className="hidden rounded-lg border border-border bg-surface p-4 md:block">
						<h3 className="text-sm font-semibold text-foreground">Before you join</h3>
						<ul className="mt-2 grid gap-1 text-sm text-foreground-secondary sm:grid-cols-2">
							<li className="flex items-center gap-2">
								<Headphones aria-hidden="true" className="size-4 shrink-0" />
								Use headphones to reduce echo.
							</li>
							<li className="flex items-center gap-2">
								<Volume1 aria-hidden="true" className="size-4 shrink-0" />
								Choose a quiet space.
							</li>
						</ul>
					</div>
				</div>

				<div className="space-y-4">
					{isDesktop ? (
						<div className="rounded-lg border border-border bg-surface p-4">
							<h3 className="mb-3 text-base font-semibold text-foreground">Devices</h3>
							{devicePanel}
						</div>
					) : (
						<Disclosure as="div" className="rounded-lg border border-border bg-surface">
							{({open}) => (
								<>
									<DisclosureButton className="flex min-h-11 w-full items-center justify-between gap-2 px-4 py-3 text-left text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
										Devices
										<ChevronDown
											aria-hidden="true"
											className={`size-4 text-foreground-secondary transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
										/>
									</DisclosureButton>
									{!open && (
										<p className="px-4 pb-3 text-sm text-foreground-secondary">
											Camera: {media.cameras.find((c) => c.deviceId === media.selection.cameraId)?.label ?? 'Not available'}
											<br />
											Microphone:{' '}
											{media.microphones.find((m) => m.deviceId === media.selection.microphoneId)?.label ?? 'Not available'}
										</p>
									)}
									<DisclosurePanel className="px-4 pb-4">{devicePanel}</DisclosurePanel>
								</>
							)}
						</Disclosure>
					)}

					<div className="rounded-lg border border-border bg-surface p-4">
						<h3 className="mb-3 text-base font-semibold text-foreground">Connection check</h3>
						<ConnectionChecks checks={checks} />
					</div>

					<p className="flex items-start gap-2 text-sm text-foreground-secondary">
						<ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
						{PREJOIN_ENCRYPTION_NOTE}
					</p>
				</div>
			</div>

			{errorMessage && (
				<div className="rounded-lg border border-danger bg-surface p-4" role="alert">
					<p className="text-sm text-foreground">{errorMessage}</p>
				</div>
			)}

			<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
				<Link
					href={backHref}
					className="inline-flex h-11 items-center rounded-md border border-input bg-surface px-4 text-sm font-medium text-foreground hover:border-input-hover hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-neutral focus-visible:ring-offset-2 max-sm:hidden"
				>
					Back to appointment
				</Link>
				<div className="flex flex-1 flex-wrap items-center justify-end gap-3 max-sm:flex-col-reverse max-sm:items-stretch">
					<ReadinessStatus phase={phase} />
					<Button
						type="button"
						size="lg"
						isLoading={isJoining}
						disabled={action.disabled}
						onClick={() => void handleJoin(action.audioOnly)}
					>
						{action.label}
					</Button>
				</div>
			</div>
		</section>
	);
}
