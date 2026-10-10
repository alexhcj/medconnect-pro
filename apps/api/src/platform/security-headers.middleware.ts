import type {NextFunction, Request, Response} from 'express';
import type {AppEnvName} from './cors-origins.js';

const MEDIA_TOKEN_PATH = /^\/telehealth\/sessions\/[^/]+\/media-token\/?$/;

export function isNoStorePath(path: string): boolean {
	return path.startsWith('/auth/') || MEDIA_TOKEN_PATH.test(path);
}

export function createSecurityHeadersMiddleware(appEnv: AppEnvName) {
	const hsts = appEnv !== 'local';
	return (req: Request, res: Response, next: NextFunction): void => {
		res.setHeader('X-Content-Type-Options', 'nosniff');
		res.setHeader('Referrer-Policy', 'no-referrer');
		res.setHeader('X-Frame-Options', 'DENY');
		res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
		if (hsts) {
			res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
		}
		if (isNoStorePath(req.path)) {
			res.setHeader('Cache-Control', 'no-store');
		}
		next();
	};
}
