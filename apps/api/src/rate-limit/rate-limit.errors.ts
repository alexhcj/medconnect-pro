export class RateLimitedError extends Error {
	constructor(readonly retryAfterSeconds: number) {
		super('Rate limit exceeded');
		this.name = 'RateLimitedError';
	}
}

export class RateLimitUnavailableError extends Error {
	constructor() {
		super('Rate limiter unavailable');
		this.name = 'RateLimitUnavailableError';
	}
}
