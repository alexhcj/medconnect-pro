import type {Permission} from '@/types/auth/permissions';
import type {Role} from '@/types/auth/roles';

export interface SessionInfo {
	sessionId: string;
	userId: string;
	userRole: Role;
	expiresAt: number;
	lastActivity: number;
	isActive: boolean;
	permissions: Permission[];
	currentContext: string;
}

export type SessionLoginResult = {
	kind: 'session';
	session: SessionInfo;
};

export type MfaChallengeResult = {
	kind: 'mfa';
	mfaToken: string;
	expiresIn: number;
};

export type LoginOutcome = SessionLoginResult | MfaChallengeResult;

export type VerifyMfaInput = {
	email: string;
	code: string;
	mfaToken: string;
};

export interface ConcurrentSessionInfo {
	sessionId: string;
	location: string;
	device: string;
	browser: string;
	ipAddress: string;
	loginTime: number;
	lastActivity: number;
	isCurrentSession: boolean;
}

export interface ExtendSessionResponse {
	success: boolean;
	newExpiresAt: number;
	token?: string;
}

export interface ActivityEvent {
	type: 'mouse' | 'keyboard' | 'click' | 'scroll' | 'focus';
	timestamp: number;
	context?: string;
}
