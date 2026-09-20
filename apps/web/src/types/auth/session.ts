export interface SessionInfo {
	sessionId: string;
	userId: string;
	userRole: string;
	expiresAt: number;
	lastActivity: number;
	isActive: boolean;
	permissions: string[];
	currentContext: string;
}

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
