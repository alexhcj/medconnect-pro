export const DEFAULT_LOCAL_WEB_ORIGIN = 'http://localhost:3000';
export const AMPLIFY_PREVIEW_HOST_PATTERN = 'https://*.amplifyapp.com';

export type AppEnvName = 'local' | 'preview' | 'production';

export function resolveAppEnv(env: NodeJS.ProcessEnv = process.env): AppEnvName {
	if (env.APP_ENV === 'preview' || env.APP_ENV === 'production') {
		return env.APP_ENV;
	}
	return 'local';
}

export type CorsOriginPolicy = {
	exact: ReadonlySet<string>;
	allowAmplifyPreviewHosts: boolean;
};

export function splitOriginEntries(
	webOrigin: string | undefined,
	webOrigins: string | undefined,
): string[] {
	const seen = new Set<string>();
	const entries: string[] = [];
	for (const raw of [...(webOrigin ?? '').split(','), ...(webOrigins ?? '').split(',')]) {
		const value = raw.trim();
		if (!value || seen.has(value)) {
			continue;
		}
		seen.add(value);
		entries.push(value);
	}
	return entries;
}

export function isLocalhostOrigin(origin: string): boolean {
	try {
		const hostname = new URL(origin).hostname;
		return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
	} catch {
		return false;
	}
}

export function isAmplifyPreviewHostPattern(entry: string): boolean {
	return entry === AMPLIFY_PREVIEW_HOST_PATTERN;
}

export function isWildcardOrigin(entry: string): boolean {
	return entry.includes('*');
}

export function productionCorsRejection(entries: string[]): string | undefined {
	for (const entry of entries) {
		if (isLocalhostOrigin(entry)) {
			return 'Production CORS must not allow localhost origins';
		}
		if (isWildcardOrigin(entry) || isAmplifyPreviewHostPattern(entry)) {
			return 'Production CORS must not allow preview hostname patterns';
		}
	}
	return undefined;
}

export function matchesAmplifyPreviewOrigin(requestOrigin: string): boolean {
	try {
		const url = new URL(requestOrigin);
		if (url.protocol !== 'https:' || url.port !== '') {
			return false;
		}
		return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.amplifyapp\.com$/i.test(
			url.hostname,
		);
	} catch {
		return false;
	}
}

export function resolveCorsOriginPolicy(input: {
	appEnv: AppEnvName;
	webOrigin?: string;
	webOrigins?: string;
}): CorsOriginPolicy {
	const entries = splitOriginEntries(input.webOrigin, input.webOrigins);
	if (input.appEnv === 'local' && entries.length === 0) {
		return {exact: new Set([DEFAULT_LOCAL_WEB_ORIGIN]), allowAmplifyPreviewHosts: false};
	}

	const exact = new Set<string>();
	let allowAmplifyPreviewHosts = false;
	for (const entry of entries) {
		if (input.appEnv === 'preview' && isAmplifyPreviewHostPattern(entry)) {
			allowAmplifyPreviewHosts = true;
			continue;
		}
		exact.add(entry);
	}
	return {exact, allowAmplifyPreviewHosts};
}

export function isCorsOriginAllowed(
	policy: CorsOriginPolicy,
	requestOrigin: string | undefined,
): boolean {
	if (!requestOrigin) {
		return true;
	}
	if (policy.exact.has(requestOrigin)) {
		return true;
	}
	return policy.allowAmplifyPreviewHosts && matchesAmplifyPreviewOrigin(requestOrigin);
}
