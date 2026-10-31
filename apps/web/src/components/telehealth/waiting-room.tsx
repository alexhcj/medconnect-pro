'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {
	checkPrejoinDevices,
	PREJOIN_DEVICE_COPY,
	type PrejoinDeviceStatus,
} from '@/lib/telehealth/prejoin-devices';

interface WaitingRoomProps {
	onJoin: () => void;
	isJoining: boolean;
	errorMessage?: string;
}

export function WaitingRoom({onJoin, isJoining, errorMessage}: WaitingRoomProps) {
	const [deviceStatus, setDeviceStatus] = useState<PrejoinDeviceStatus>(() =>
		isMockMode() ? 'ready' : 'idle',
	);

	async function handleCheckDevices() {
		if (isMockMode()) {
			setDeviceStatus('ready');
			return;
		}
		setDeviceStatus('checking');
		const next = await checkPrejoinDevices();
		setDeviceStatus(next);
	}

	const deviceCopy =
		deviceStatus === 'idle' || deviceStatus === 'checking'
			? 'Check camera and microphone before you join. If the browser denies access, you can still join.'
			: PREJOIN_DEVICE_COPY[deviceStatus];

	return (
		<div className="space-y-4">
			<Card>
				<CardContent className="p-4">
					<h2 className="text-lg font-semibold text-gray-900">Waiting room</h2>
					<p className="mt-2 text-sm text-gray-700">
						You are in the waiting room. Join the session when you are ready. Camera and microphone
						start after you join.
					</p>
					<p className="mt-2 text-sm text-gray-700" aria-live="polite">
						{deviceStatus === 'checking' ? 'Checking camera and microphone…' : deviceCopy}
					</p>
				</CardContent>
			</Card>
			{errorMessage && (
				<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
					<p className="text-sm text-gray-700">{errorMessage}</p>
				</div>
			)}
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					isLoading={deviceStatus === 'checking'}
					disabled={isJoining}
					onClick={() => void handleCheckDevices()}
				>
					Check camera and microphone
				</Button>
				<Button type="button" onClick={onJoin} isLoading={isJoining}>
					Join session
				</Button>
			</div>
		</div>
	);
}
