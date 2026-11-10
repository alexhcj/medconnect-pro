'use client';

import {useEffect, useRef} from 'react';
import Image from 'next/image';
import {Radio, RadioGroup} from '@headlessui/react';
import {CircleCheck, Loader2, TriangleAlert} from 'lucide-react';
import {cn} from '@/lib/utils/utils';
import {
	DEMO_PERSONAS,
	SYNTHETIC_CAMERA_LABEL,
	personaFor,
	type DemoPersonaKey,
} from '@/lib/telehealth/demo-personas';

export type CameraSource = 'camera' | 'persona';

export const PERSONA_BANNER_TEXT = 'Demo build. The persona camera sends an illustrated video, not your camera.';
export const PERSONA_PRIVACY_TITLE_ON = 'Your real camera stays off';
export const PERSONA_PRIVACY_BODY_ON =
	"Your camera stays off. The call shows this account's illustrated persona instead of your camera feed.";
export const PERSONA_PRIVACY_TITLE_OFF = 'Your camera is shared';
export const PERSONA_PRIVACY_BODY_OFF =
	'Other participants see your live camera. Switch to Demo persona camera to keep your face off video.';
export const PERSONA_FALLBACK_NOTICE = 'Persona camera unavailable. Using your camera.';

/** Demo builds only: says the persona option is a demo feature (SEC-013 scope 9). */
export function DemoPersonaBanner() {
	return (
		<p className="flex items-start gap-2 rounded-md border border-warning bg-warning-subtle p-3 text-sm text-foreground" data-testid="persona-demo-banner">
			<TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
			{PERSONA_BANNER_TEXT}
		</p>
	);
}

/** Always-visible label on the persona preview. A solid chip keeps the text readable on any art. */
export function SyntheticBadge({className}: {className?: string}) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-brand-strong shadow-sm',
				className,
			)}
		>
			{SYNTHETIC_CAMERA_LABEL}
		</span>
	);
}

const SOURCES: {value: CameraSource; label: string}[] = [
	{value: 'camera', label: 'My camera'},
	{value: 'persona', label: 'Demo persona camera'},
];

/** My camera / Demo persona camera. Same pattern as the Background picker. */
export function CameraSourcePicker({value, onChange}: {value: CameraSource; onChange: (value: CameraSource) => void}) {
	return (
		<RadioGroup
			value={value}
			onChange={onChange}
			aria-label="Camera source"
			className="grid grid-cols-2 gap-2 max-sm:grid-cols-1"
		>
			{SOURCES.map((source) => (
				<Radio
					key={source.value}
					value={source.value}
					className="group flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-checked:border-2 data-checked:border-brand data-checked:bg-brand-subtle"
				>
					<span
						aria-hidden="true"
						className="flex size-4 shrink-0 items-center justify-center rounded-full border border-input group-data-checked:border-brand"
					>
						<span className="hidden size-2 rounded-full bg-brand group-data-checked:block" />
					</span>
					{source.label}
				</Radio>
			))}
		</RadioGroup>
	);
}

/**
 * The three personas. Only the signed-in account's own persona is selected; the others are shown
 * dimmed for context and cannot be chosen. The name on the card is the demo catalog name, never
 * the name used in the call (that comes from Nest).
 */
export function PersonaStrip({activeKey}: {activeKey: DemoPersonaKey}) {
	return (
		<div className="space-y-2">
			<div className="flex items-baseline justify-between gap-3">
				<h4 className="text-sm font-medium text-foreground-label">Your persona</h4>
				<span className="text-xs text-foreground-secondary">One per demo account</span>
			</div>
			<p className="text-xs text-foreground-secondary">
				Your name in the call comes from your sign-in. Each demo account has its own illustrated persona.
			</p>
			<ul aria-label="Demo personas" className="grid grid-cols-3 gap-2.5">
				{DEMO_PERSONAS.map((persona) => {
					const own = persona.key === activeKey;
					return (
						<li
							key={persona.key}
							aria-current={own ? 'true' : undefined}
							aria-disabled={own ? undefined : 'true'}
							className={cn(
								'overflow-hidden rounded-lg border bg-surface',
								own ? 'border-2 border-brand bg-brand-subtle' : 'border-border opacity-55',
							)}
						>
							<div className="relative h-[60px] overflow-hidden bg-subtle">
								<Image
									src={persona.src}
									alt=""
									width={150}
									height={84}
									unoptimized
									className="absolute left-1/2 top-0 h-[84px] w-[150px] max-w-none -translate-x-1/2"
								/>
							</div>
							<div className="space-y-0.5 px-2 pb-2 pt-1.5">
								<p className="flex items-center justify-between gap-1 text-xs font-medium text-foreground">
									<span className="truncate">{persona.cardName}</span>
									{own && <CircleCheck aria-hidden="true" className="size-3.5 shrink-0 text-brand" />}
								</p>
								<p className="text-xs text-foreground-secondary">
									{persona.roleLabel}
									{own && <span className="sr-only"> (your persona)</span>}
									{!own && <span className="sr-only"> (not your account, not selectable)</span>}
								</p>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

/** The live persona canvas stream. Not mirrored, muted, labeled as synthetic. */
export function PersonaPreview({stream, personaKey, displayName}: {stream: MediaStream | null; personaKey: DemoPersonaKey; displayName: string}) {
	const ref = useRef<HTMLVideoElement>(null);
	const persona = personaFor(personaKey);

	useEffect(() => {
		const element = ref.current;
		if (!element) {
			return;
		}
		element.srcObject = stream;
		return () => {
			element.srcObject = null;
		};
	}, [stream]);

	return (
		<div className="relative size-full bg-subtle">
			{stream ? (
				<video
					ref={ref}
					autoPlay
					muted
					playsInline
					aria-label={`Demo persona camera preview, ${displayName}, synthetic`}
					className="size-full object-cover"
				/>
			) : (
				<div role="status" className="flex size-full flex-col items-center justify-center gap-3 text-center">
					<Loader2 aria-hidden="true" className="size-8 animate-spin text-foreground-secondary motion-reduce:animate-none" />
					<p className="text-sm text-foreground-secondary">Starting the demo persona camera…</p>
				</div>
			)}
			<SyntheticBadge className="absolute right-3 top-3" />
			<p className="absolute bottom-3 left-3 rounded-md bg-surface px-3 py-1.5 text-sm font-medium text-foreground shadow-sm">
				{displayName} · {persona.roleLabel} · Synthetic
			</p>
		</div>
	);
}
