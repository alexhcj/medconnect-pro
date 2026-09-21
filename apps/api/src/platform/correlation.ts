import {randomUUID} from 'node:crypto';
import type {Request} from 'express';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

const CORRELATION_ID_KEY = 'correlationId';

type RequestWithCorrelation = Request & {
	[CORRELATION_ID_KEY]?: string;
};

export function resolveCorrelationId(incoming: string | undefined): string {
	const trimmed = incoming?.trim();
	return trimmed ? trimmed : randomUUID();
}

export function setRequestCorrelationId(req: Request, correlationId: string): void {
	(req as RequestWithCorrelation)[CORRELATION_ID_KEY] = correlationId;
}

export function getCorrelationId(req: Request): string {
	return (req as RequestWithCorrelation)[CORRELATION_ID_KEY] ?? 'unknown';
}
