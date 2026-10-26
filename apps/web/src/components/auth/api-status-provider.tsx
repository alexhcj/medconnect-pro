'use client';

import {createContext, useContext} from 'react';
import {useApiStatus, type ApiStatusControls} from '@/lib/api-status/use-api-status';

const ApiStatusContext = createContext<ApiStatusControls | null>(null);

/** Shares one API status between the `/login` form and the status indicator (FE-049). */
export function ApiStatusProvider({
	children,
	enabled,
}: {
	children: React.ReactNode;
	/** Override for tests. Defaults to off in mock mode and PR previews. */
	enabled?: boolean;
}) {
	const status = useApiStatus({enabled});
	return <ApiStatusContext.Provider value={status}>{children}</ApiStatusContext.Provider>;
}

/** `null` outside a provider, so a form rendered without one behaves as before. */
export function useApiStatusContext(): ApiStatusControls | null {
	return useContext(ApiStatusContext);
}
