import type {AppEnvName} from '../../platform/cors-origins.js';
import {FakeOidcAdapter} from './fake-oidc.adapter.js';
import {GoogleOidcAdapter} from './google-oidc.adapter.js';
import {
	OidcExchangeError,
	type OidcProviderKey,
	type OidcProviderPort,
} from './oidc-provider.port.js';

export type OidcEnv = {
	APP_ENV: AppEnvName;
	OIDC_PROVIDER?: OidcProviderKey;
	OIDC_ISSUER?: string;
	OIDC_CLIENT_ID?: string;
	OIDC_CLIENT_SECRET?: string;
	OIDC_REDIRECT_URI?: string;
	OIDC_DEMO_EMAIL?: string;
};

export class UnavailableOidcAdapter implements OidcProviderPort {
	readonly available = false;
	readonly issuer = '';
	readonly clientId = '';

	constructor(readonly key: OidcProviderKey) {}

	async buildAuthorizeUrl(): Promise<string> {
		throw new OidcExchangeError('not_configured');
	}

	async exchangeCode(): Promise<never> {
		throw new OidcExchangeError('not_configured');
	}
}

/** Google when fully configured; Fake only for APP_ENV=local; otherwise a labeled 503 stand-in. */
export function createOidcProvider(env: OidcEnv): OidcProviderPort {
	const {OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_REDIRECT_URI} = env;
	if (
		env.OIDC_PROVIDER !== 'fake' &&
		OIDC_ISSUER &&
		OIDC_CLIENT_ID &&
		OIDC_CLIENT_SECRET &&
		OIDC_REDIRECT_URI
	) {
		return new GoogleOidcAdapter({
			issuer: OIDC_ISSUER,
			clientId: OIDC_CLIENT_ID,
			clientSecret: OIDC_CLIENT_SECRET,
			redirectUri: OIDC_REDIRECT_URI,
		});
	}
	if (env.APP_ENV === 'local' && env.OIDC_PROVIDER !== 'google') {
		return new FakeOidcAdapter(undefined, env.OIDC_DEMO_EMAIL);
	}
	return new UnavailableOidcAdapter(env.OIDC_PROVIDER === 'fake' ? 'fake' : 'google');
}
