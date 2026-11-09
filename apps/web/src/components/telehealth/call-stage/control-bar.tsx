'use client';

import type {ReactNode} from 'react';
import {
	Ellipsis,
	Mic,
	MicOff,
	MonitorUp,
	PhoneOff,
	Sparkles,
	SlidersHorizontal,
	SwitchCamera,
	Users,
	Video,
	VideoOff,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Tooltip} from '@/components/ui/tooltip';
import {shortcutModifierLabel} from '@/components/telehealth/call-stage/use-call-shortcuts';
import {cn} from '@/lib/utils/utils';

const CIRCLE =
	'flex size-12 items-center justify-center rounded-full border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-stage-bg) disabled:cursor-not-allowed disabled:opacity-50';
const CIRCLE_IDLE =
	'border-(--color-stage-border) bg-(--color-stage-surface) text-(--color-stage-text) hover:border-(--color-stage-border-strong)';
const CIRCLE_ON =
	'border-(--color-stage-border-strong) bg-(--color-stage-surface-raised) text-(--color-stage-text)';
const CIRCLE_ACTIVE = 'border-brand bg-brand text-inverse hover:bg-brand-hover';

function ControlButton({
	name,
	shortName,
	icon,
	pressed,
	expanded,
	disabled,
	onClick,
	tooltip,
	shortcut,
	activeStyle,
	className,
}: {
	/** Accessible name. Stays the same whatever the state (`aria-pressed` carries it). */
	name: string;
	/** Compact visible label for very narrow screens. */
	shortName?: string;
	icon: ReactNode;
	pressed?: boolean;
	expanded?: boolean;
	disabled?: boolean;
	onClick: () => void;
	tooltip?: string;
	shortcut?: string;
	/** Use the brand fill when on (screen share, participants) instead of the neutral raised fill. */
	activeStyle?: boolean;
	className?: string;
}) {
	const on = pressed ?? expanded ?? false;
	return (
		<div className={cn('flex flex-col items-center gap-1 max-sm:w-[58px]', className)}>
			<Tooltip label={tooltip ?? name}>
				<button
					type="button"
					aria-label={name}
					aria-pressed={pressed}
					aria-expanded={expanded}
					aria-keyshortcuts={shortcut}
					disabled={disabled}
					onClick={onClick}
					className={cn(CIRCLE, on ? (activeStyle ? CIRCLE_ACTIVE : CIRCLE_ON) : CIRCLE_IDLE)}
				>
					{icon}
				</button>
			</Tooltip>
			<span aria-hidden="true" className="text-center text-xs leading-tight text-(--color-stage-text-muted)">
				{shortName ? (
					<>
						<span className="max-[359px]:hidden">{name}</span>
						<span className="min-[360px]:hidden">{shortName}</span>
					</>
				) : (
					name
				)}
			</span>
		</div>
	);
}

export interface ControlBarProps {
	microphoneOn: boolean;
	cameraOn: boolean;
	screenShareOn: boolean;
	participantsOpen: boolean;
	controlsEnabled: boolean;
	canShareScreen: boolean;
	/** From the server host rule (`viewerCanEnd`). Never decided by role in the UI. */
	canEnd: boolean;
	isEnding: boolean;
	onToggleMicrophone: () => void;
	onToggleCamera: () => void;
	onToggleScreenShare: () => void;
	onOpenBackground: () => void;
	onOpenDevices: () => void;
	onToggleParticipants: () => void;
	onFlipCamera: () => void;
	onOpenMore: () => void;
	onLeave: () => void;
	onRequestEnd: () => void;
}

/**
 * Desktop and tablet: Microphone, Camera, Share screen, Background, Devices, Participants, then
 * Leave call and (host only) End visit. At 390 px and below: Microphone, Camera, Flip camera, More
 * and Leave call; Devices, Participants, Background and End visit move into the More sheet.
 * Labels never change with state, `aria-pressed` does.
 */
export function ControlBar(props: ControlBarProps) {
	const mod = shortcutModifierLabel();
	const off = !props.controlsEnabled;

	return (
		<div
			role="group"
			aria-label="Call controls"
			className="flex flex-wrap items-start justify-center gap-x-1 gap-y-3 border-t border-(--color-stage-border) bg-(--color-stage-bg) px-1.5 py-3 sm:gap-x-4 sm:px-6 max-sm:rounded-t-[20px] max-sm:bg-(--color-stage-surface) max-sm:pb-6"
		>
			<ControlButton
				name="Microphone"
				shortName="Mic"
				pressed={props.microphoneOn}
				disabled={off}
				onClick={props.onToggleMicrophone}
				tooltip={`Microphone (${mod}+M)`}
				shortcut="Alt+M"
				icon={props.microphoneOn ? <Mic aria-hidden="true" className="size-5" /> : <MicOff aria-hidden="true" className="size-5" />}
			/>
			<ControlButton
				name="Camera"
				pressed={props.cameraOn}
				disabled={off}
				onClick={props.onToggleCamera}
				tooltip={`Camera (${mod}+V)`}
				shortcut="Alt+V"
				icon={props.cameraOn ? <Video aria-hidden="true" className="size-5" /> : <VideoOff aria-hidden="true" className="size-5" />}
			/>
			{props.canShareScreen && (
				<ControlButton
					className="max-sm:hidden"
					name="Share screen"
					pressed={props.screenShareOn}
					activeStyle
					disabled={off}
					onClick={props.onToggleScreenShare}
					icon={<MonitorUp aria-hidden="true" className="size-5" />}
				/>
			)}
			<ControlButton
				className="max-sm:hidden"
				name="Background"
				disabled={off}
				onClick={props.onOpenBackground}
				icon={<Sparkles aria-hidden="true" className="size-5" />}
			/>
			<ControlButton
				className="max-sm:hidden"
				name="Devices"
				disabled={off}
				onClick={props.onOpenDevices}
				icon={<SlidersHorizontal aria-hidden="true" className="size-5" />}
			/>
			<ControlButton
				className="max-sm:hidden"
				name="Participants"
				expanded={props.participantsOpen}
				activeStyle
				onClick={props.onToggleParticipants}
				icon={<Users aria-hidden="true" className="size-5" />}
			/>

			<ControlButton
				className="sm:hidden"
				name="Flip camera"
				disabled={off}
				onClick={props.onFlipCamera}
				icon={<SwitchCamera aria-hidden="true" className="size-5" />}
			/>
			<ControlButton
				className="sm:hidden"
				name="More"
				onClick={props.onOpenMore}
				icon={<Ellipsis aria-hidden="true" className="size-5" />}
			/>

			<span aria-hidden="true" className="mx-1 h-12 w-px self-start bg-(--color-stage-border) max-sm:hidden" />

			<div className="flex flex-col items-center gap-1 max-sm:w-[58px] sm:flex-row sm:gap-3">
				<Button
					type="button"
					variant="outline"
					aria-label="Leave call"
					onClick={props.onLeave}
					className={cn(
						'h-12 min-w-12 border-white bg-white px-5 text-gray-900 sm:hover:bg-gray-100 sm:hover:text-gray-900 focus-visible:ring-ring focus-visible:ring-offset-(--color-stage-bg)',
						'max-sm:size-12 max-sm:rounded-full max-sm:border-(--color-stage-border-strong) max-sm:bg-(--color-stage-surface-raised) max-sm:p-0 max-sm:text-(--color-stage-text) max-sm:hover:bg-(--color-stage-surface-raised) max-sm:hover:text-(--color-stage-text)',
					)}
				>
					<PhoneOff aria-hidden="true" className="size-5 sm:hidden" />
					<span aria-hidden="true" className="max-sm:hidden">
						Leave call
					</span>
				</Button>
				<span aria-hidden="true" className="text-xs text-(--color-stage-text-muted) sm:hidden">
					Leave call
				</span>
				{props.canEnd && (
					<Button
						type="button"
						variant="destructive"
						isLoading={props.isEnding}
						onClick={props.onRequestEnd}
						className="h-12 px-5 focus-visible:ring-offset-(--color-stage-bg) max-sm:hidden"
					>
						End visit
					</Button>
				)}
			</div>
		</div>
	);
}
