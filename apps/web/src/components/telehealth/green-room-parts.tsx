'use client';

import {useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import {Radio, RadioGroup} from '@headlessui/react';
import {Check, CircleAlert, CircleCheck, CircleDashed, Loader2, Mic, VideoOff} from 'lucide-react';
import {cn} from '@/lib/utils/utils';
import {LEVEL_SEGMENTS} from '@/lib/hooks/use-prejoin-media';
import {
	BACKGROUND_IMAGES,
	type BackgroundChoice,
	type BackgroundImageId,
} from '@/lib/telehealth/prejoin-backgrounds';
import type {PrejoinCheck} from '@/lib/telehealth/prejoin-checks';
import type {PrejoinPhase} from '@/lib/telehealth/prejoin-devices';

export const PREJOIN_ENCRYPTION_NOTE = 'Encrypted connection. This visit is not recorded.';

/** The live local camera. Mirrored like a mirror, muted, never sent anywhere from here. */
export function CameraPreview({track, label}: {track: MediaStreamTrack | null; label: string}) {
	const ref = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		const element = ref.current;
		if (!element) {
			return;
		}
		element.srcObject = track ? new MediaStream([track]) : null;
		return () => {
			element.srcObject = null;
		};
	}, [track]);

	if (!track) {
		return (
			<div
				role="img"
				aria-label="Camera preview placeholder"
				className="flex size-full flex-col items-center justify-center gap-2 bg-foreground text-inverse"
			>
				<span className="flex size-16 items-center justify-center rounded-full bg-foreground-secondary text-xl font-semibold">
					{label}
				</span>
				<span className="text-sm text-inverse/80">Demo preview. No camera in mock mode.</span>
			</div>
		);
	}

	return <video ref={ref} autoPlay muted playsInline aria-label="Your camera preview" className="size-full -scale-x-100 object-cover" />;
}

/** The panel shown instead of the preview while checking, blocked or without a camera. */
export function PreviewProblem({
	phase,
	onRetry,
	onAudioOnly,
}: {
	phase: Exclude<PrejoinPhase, 'ready'>;
	onRetry: () => void;
	onAudioOnly: () => void;
}) {
	if (phase === 'checking') {
		return (
			<div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center" role="status">
				<Loader2 aria-hidden="true" className="size-8 animate-spin text-foreground-secondary motion-reduce:animate-none" />
				<p className="text-base font-semibold text-foreground">Checking camera and microphone…</p>
				<p className="text-sm text-foreground-secondary">Allow access when your browser asks.</p>
			</div>
		);
	}

	const blocked = phase === 'blocked';
	return (
		<div className="flex size-full flex-col items-center justify-center gap-4 p-6 text-center">
			<VideoOff aria-hidden="true" className="size-8 text-foreground-secondary" />
			<h3 className="text-lg font-semibold text-foreground">
				{blocked ? 'Camera and microphone are blocked' : 'No camera found'}
			</h3>
			<ol className="w-full max-w-md list-decimal space-y-2 pl-6 text-left text-sm text-foreground-secondary">
				{blocked ? (
					<>
						<li>
							<span className="sm:hidden">Tap the lock icon in the address bar</span>
							<span className="hidden sm:inline">Click the camera icon in the address bar</span>
						</li>
						<li>Allow camera and microphone</li>
						<li>
							<span className="sm:hidden">Tap Try again</span>
							<span className="hidden sm:inline">Select Try again</span>
						</li>
					</>
				) : (
					<>
						<li>Connect a camera to this device</li>
						<li>Close other apps that use the camera</li>
						<li>
							<span className="sm:hidden">Tap Check again</span>
							<span className="hidden sm:inline">Select Check again</span>
						</li>
					</>
				)}
			</ol>
			<button
				type="button"
				onClick={onRetry}
				className="inline-flex h-11 w-full max-w-md cursor-pointer items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-inverse hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			>
				{blocked ? 'Try again' : 'Check again'}
			</button>
			<button
				type="button"
				onClick={onAudioOnly}
				className="inline-flex h-11 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
			>
				Join with audio only
			</button>
		</div>
	);
}

/**
 * Twelve-segment input level. It is a `meter` with a text alternative, and it is not a live region:
 * the level changes many times a second and must not be announced.
 */
export function LevelMeter({lit, statusText}: {lit: number; statusText: string}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-3 text-sm">
				<span className="flex items-center gap-2 text-foreground">
					<Mic aria-hidden="true" className="size-4 text-foreground-secondary" />
					{statusText}
				</span>
				<span className="text-xs text-foreground-secondary max-sm:sr-only">Input level</span>
			</div>
			<div
				role="meter"
				aria-label="Microphone input level"
				aria-valuemin={0}
				aria-valuemax={LEVEL_SEGMENTS}
				aria-valuenow={lit}
				aria-valuetext={`${lit} of ${LEVEL_SEGMENTS}`}
				className="grid grid-cols-12 gap-1"
			>
				{Array.from({length: LEVEL_SEGMENTS}, (_, index) => (
					<span
						key={index}
						aria-hidden="true"
						className={cn('h-2 rounded-sm', index < lit ? 'bg-success' : 'bg-muted')}
					/>
				))}
			</div>
		</div>
	);
}

const SEGMENTS: {kind: BackgroundChoice['kind']; label: string}[] = [
	{kind: 'none', label: 'None'},
	{kind: 'blur', label: 'Blur'},
	{kind: 'image', label: 'Image'},
];

/** None / Blur / Image, then the three built-in images. No upload and no URL input. */
export function BackgroundPicker({
	value,
	onChange,
	disabled,
}: {
	value: BackgroundChoice;
	onChange: (choice: BackgroundChoice) => void;
	disabled?: boolean;
}) {
	// Switching back to Image restores the image that was last picked.
	const [lastImage, setLastImage] = useState<BackgroundImageId>(
		value.kind === 'image' ? value.imageId : 'clinic-exam-room',
	);

	return (
		<div className="flex flex-col gap-2">
			<RadioGroup
				value={value.kind}
				onChange={(kind: BackgroundChoice['kind']) =>
					onChange(kind === 'image' ? {kind, imageId: lastImage} : {kind})
				}
				disabled={disabled}
				aria-label="Background"
				className="grid grid-cols-3 gap-0.5 rounded-md border border-border bg-subtle p-0"
			>
				{SEGMENTS.map((segment) => (
					<Radio
						key={segment.kind}
						value={segment.kind}
						className="group flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent text-sm text-foreground-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-checked:border-border data-checked:bg-surface data-checked:font-medium data-checked:text-brand-strong data-disabled:cursor-not-allowed data-disabled:opacity-50"
					>
						<Check aria-hidden="true" className="hidden size-3.5 group-data-checked:block" />
						{segment.label}
					</Radio>
				))}
			</RadioGroup>
			{value.kind === 'image' && (
				<RadioGroup
					value={value.imageId}
					onChange={(imageId: BackgroundImageId) => {
						setLastImage(imageId);
						onChange({kind: 'image', imageId});
					}}
					disabled={disabled}
					aria-label="Background image"
					className="grid grid-cols-3 gap-2"
				>
					{BACKGROUND_IMAGES.map((image) => (
						<Radio
							key={image.id}
							value={image.id}
							className="group flex min-h-11 cursor-pointer flex-col gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-disabled:cursor-not-allowed data-disabled:opacity-50"
						>
							<Image
								src={image.src}
								alt=""
								width={160}
								height={90}
								className="h-14 w-full rounded-md object-cover outline-offset-0 group-data-checked:outline-2 group-data-checked:outline-brand"
							/>
							<span className="text-xs text-foreground-secondary group-data-checked:font-medium group-data-checked:text-brand-strong">
								{image.label}
							</span>
						</Radio>
					))}
				</RadioGroup>
			)}
		</div>
	);
}

const CHECK_ICON = {
	pass: {Icon: CircleCheck, className: 'text-success'},
	fail: {Icon: CircleAlert, className: 'text-danger'},
	checking: {Icon: Loader2, className: 'animate-spin motion-reduce:animate-none text-foreground-secondary'},
	deferred: {Icon: CircleDashed, className: 'text-foreground-secondary'},
} as const;

const CHECK_STATE_TEXT = {
	pass: 'Passed',
	fail: 'Needs attention',
	checking: 'Checking',
	deferred: 'Not checked yet',
} as const;

export function ConnectionChecks({checks}: {checks: PrejoinCheck[]}) {
	return (
		<ul aria-label="Connection checks" className="space-y-2">
			{checks.map((check) => {
				const {Icon, className} = CHECK_ICON[check.state];
				return (
					<li key={check.id} className="flex items-center justify-between gap-3 text-sm">
						<span className={cn('flex items-center gap-2', check.state === 'fail' ? 'text-danger' : 'text-foreground')}>
							<Icon aria-hidden="true" className={cn('size-4 shrink-0', className)} />
							{check.label}
							<span className="sr-only"> — {CHECK_STATE_TEXT[check.state]}</span>
						</span>
						{check.detail && <span className="text-foreground-secondary">{check.detail}</span>}
					</li>
				);
			})}
		</ul>
	);
}
