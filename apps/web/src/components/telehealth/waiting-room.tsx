'use client';

import {Button} from '@/components/ui/button';

interface WaitingRoomProps {
	onJoin: () => void;
	isJoining: boolean;
	errorMessage?: string;
}

export function WaitingRoom({onJoin, isJoining, errorMessage}: WaitingRoomProps) {
	return (
		<div className="space-y-4">
			<div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
				<h2 className="text-lg font-semibold text-gray-900">Waiting room</h2>
				<p className="mt-2 text-sm text-gray-700">
					You are in the waiting room. Join the session when you are ready. Camera, microphone, and
					screen share start after you join.
				</p>
			</div>
			{errorMessage && (
				<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
					<p className="text-sm text-gray-700">{errorMessage}</p>
				</div>
			)}
			<Button type="button" onClick={onJoin} isLoading={isJoining}>
				Join session
			</Button>
		</div>
	);
}
