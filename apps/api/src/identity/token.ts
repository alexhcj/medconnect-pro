import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';

export function generateToken(): string {
	return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
	return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function constantTimeEqual(left: string, right: string): boolean {
	const leftHash = createHash('sha256').update(left, 'utf8').digest();
	const rightHash = createHash('sha256').update(right, 'utf8').digest();
	return timingSafeEqual(leftHash, rightHash);
}
