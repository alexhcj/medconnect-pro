'use client';

import {useEffect, type ReactNode} from 'react';
import {ConcurrentSessionDialog} from '@/components/session/concurrent-session-dialog';
import {SessionExtensionModal} from '@/components/session/session-extension-modal';
import {SessionWarningBanner} from '@/components/session/session-warning-banner';
import {useActivityBatcher, useSessionStatus} from '@/lib/hooks/use-session';
import {attachActivityListeners} from '@/lib/session/session-client';

export function SessionProvider({children}: {children: ReactNode}) {
	const {addActivity} = useActivityBatcher();
	const {session} = useSessionStatus();

	useEffect(() => {
		return attachActivityListeners(addActivity, session?.currentContext);
	}, [addActivity, session?.currentContext]);

	return (
		<>
			<SessionWarningBanner />
			{children}
			<SessionExtensionModal />
			<ConcurrentSessionDialog />
		</>
	);
}
