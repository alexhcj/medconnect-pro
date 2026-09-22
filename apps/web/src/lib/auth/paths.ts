export const LOGIN_PATH = '/login';
export const DASHBOARD_PATH = '/dashboard';

export function loginUrl(reason?: string): string {
	if (!reason) {
		return LOGIN_PATH;
	}
	return `${LOGIN_PATH}?reason=${encodeURIComponent(reason)}`;
}
