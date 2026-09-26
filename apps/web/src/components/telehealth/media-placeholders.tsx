'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';

function PlaceholderTile({label, active}: {label: string; active: boolean}) {
	return (
		<div
			className={`flex min-h-40 items-center justify-center rounded-lg border ${
				active ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-100'
			}`}
		>
			<p className="text-sm font-medium text-gray-700">{label}</p>
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
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<PlaceholderTile label={cameraOn ? 'Your camera is on (placeholder)' : 'Your camera is off'} active={cameraOn} />
				<PlaceholderTile
					label={screenShareOn ? 'Screen share is on (placeholder)' : 'Participant video placeholder'}
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
