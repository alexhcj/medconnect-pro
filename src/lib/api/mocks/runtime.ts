const MOCK_DELAY = parseInt(process.env.NEXT_PUBLIC_MOCK_DELAY || '500', 10);
const MOCK_ERROR_RATE = parseFloat(process.env.NEXT_PUBLIC_MOCK_ERROR_RATE || '0.05');
const MOCK_LOG_LEVEL = process.env.NEXT_PUBLIC_MOCK_LOG_LEVEL || 'info';

const LOG_LEVELS = {silent: 0, error: 1, warn: 2, info: 3, debug: 4} as const;

export function isMockMode(): boolean {
	return process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
}

export const mockDelay = (ms: number = MOCK_DELAY) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const shouldSimulateError = (errorRate: number = MOCK_ERROR_RATE) =>
	Math.random() < errorRate;

export const mockLog = (level: 'debug' | 'info' | 'warn' | 'error', ...args: unknown[]) => {
	const currentLevel = LOG_LEVELS[MOCK_LOG_LEVEL as keyof typeof LOG_LEVELS] ?? LOG_LEVELS.info;
	if (LOG_LEVELS[level] <= currentLevel) {
		console[level]('[MOCK]', ...args);
	}
};
