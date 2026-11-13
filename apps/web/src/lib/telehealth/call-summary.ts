import type {NetworkLevel, StageTile} from '@/lib/telehealth/call-participants';
import type {Role} from '@/types/auth/roles';

/**
 * What this browser saw during the call (FE-064 wrap-up). In memory only: it is gone on reload, so the
 * wrap-up hides these rows when there is nothing recorded. The server records no attendance in M22,
 * so "Seen in this call" is the client's Daily participant list and the screen says so.
 */
export interface CallSummary {
	roles: Role[];
	worstNetwork: NetworkLevel;
}

const ROLE_ORDER: readonly Role[] = ['PROVIDER', 'PATIENT', 'NURSE', 'PRACTICE_ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'];
const NETWORK_RANK: Record<NetworkLevel, number> = {unknown: 0, good: 1, fair: 2, poor: 3};

const summaries = new Map<string, CallSummary>();

export function worseNetwork(a: NetworkLevel, b: NetworkLevel): NetworkLevel {
	return NETWORK_RANK[b] > NETWORK_RANK[a] ? b : a;
}

export function recordCallSummary(sessionId: string, tiles: readonly StageTile[]): void {
	const previous = summaries.get(sessionId) ?? {roles: [], worstNetwork: 'unknown' as NetworkLevel};
	const roles = new Set<Role>(previous.roles);
	let worst = previous.worstNetwork;
	for (const tile of tiles) {
		if (tile.role) {
			roles.add(tile.role);
		}
		if (tile.isLocal) {
			worst = worseNetwork(worst, tile.network);
		}
	}
	summaries.set(sessionId, {
		roles: ROLE_ORDER.filter((role) => roles.has(role)),
		worstNetwork: worst,
	});
}

export function readCallSummary(sessionId: string): CallSummary | undefined {
	return summaries.get(sessionId);
}

export function clearCallSummaries(): void {
	summaries.clear();
}
