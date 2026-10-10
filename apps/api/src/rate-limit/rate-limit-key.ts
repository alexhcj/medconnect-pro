import {createHmac} from 'node:crypto';

export function hashRateLimitKey(secret: string, policy: string, raw: string): string {
	return createHmac('sha256', secret).update(`${policy}\n${raw}`).digest('hex');
}

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}
