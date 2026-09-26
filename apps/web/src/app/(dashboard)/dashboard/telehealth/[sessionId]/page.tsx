'use client';

import {useParams} from 'next/navigation';
import {TelehealthSessionShell} from '@/components/telehealth/telehealth-session-shell';

export default function TelehealthSessionPage() {
	const params = useParams<{sessionId: string}>();
	const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';

	return <TelehealthSessionShell sessionId={sessionId} />;
}
