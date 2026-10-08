'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {MediaConnectionStatus} from '@/components/telehealth/media-connection-status';
import {cn} from '@/lib/utils/utils';

function PlaceholderTile({label, feed, active}: {label: string; feed: string; active: boolean}) {
	return (
		<div
			className={cn(
				'flex min-h-40 flex-col justify-between rounded-lg border p-3',
				active ? 'border-brand bg-brand-subtle' : 'border-gray-200 bg-gray-100',
			)}
		>
			<p className="text-center text-sm font-medium text-gray-700">{feed}</p>
			<div className="inline-flex w-fit items-center gap-2 rounded bg-surface px-2 py-1">
				<span className="inline-block size-2 rounded-full bg-success" aria-hidden />
				<span className="text-xs text-foreground">{label}</span>
			</div>
		</div>
	);
}

export function MediaPlaceholders() {
	const [cameraOn, setCameraOn] = useState(false);
	const [microphoneOn, setMicrophoneOn] = useState(false);
	const [screenShareOn, setScreenShareOn] = useState(false);

	return (
		<div className="space-y-4">
			<p className="text-sm text-gray-600">Demo placeholder. Not a live video connection.</p>
			<MediaConnectionStatus state="mock" />
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<PlaceholderTile
					label="You"
					feed={cameraOn ? 'Your camera is on (placeholder)' : 'Your camera is off'}
					active={cameraOn}
				/>
				<PlaceholderTile
					label="Participant"
					feed={screenShareOn ? 'Screen share is on (placeholder)' : 'Participant video placeholder'}
					active={screenShareOn}
				/>
			</div>
			<div className="flex flex-wrap gap-2" role="group" aria-label="Media controls">
				<Button
					type="button"
					variant={cameraOn ? 'default' : 'outline'}
					aria-pressed={cameraOn}
					onClick={() => setCameraOn((value) => !value)}
				>
					Camera
				</Button>
				<Button
					type="button"
					variant={microphoneOn ? 'default' : 'outline'}
					aria-pressed={microphoneOn}
					onClick={() => setMicrophoneOn((value) => !value)}
				>
					Microphone
				</Button>
				<Button
					type="button"
					variant={screenShareOn ? 'default' : 'outline'}
					aria-pressed={screenShareOn}
					onClick={() => setScreenShareOn((value) => !value)}
				>
					Screen share
				</Button>
			</div>
			<p className="text-sm text-gray-600">
				Microphone is {microphoneOn ? 'on' : 'off'} (placeholder).
			</p>
		</div>
	);
}
