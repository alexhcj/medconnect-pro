import type {Request} from 'express';

/**
 * Client address as resolved by Express `trust proxy` (TRUST_PROXY hops).
 * Never read `X-Forwarded-For` directly: that would let clients choose their own key.
 */
export function clientIp(req: Request): string {
	return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}
