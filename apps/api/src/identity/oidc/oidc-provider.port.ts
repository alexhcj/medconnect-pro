export const OIDC_PROVIDER_PORT = Symbol('OIDC_PROVIDER_PORT');

export type OidcProviderKey = 'google' | 'fake';

export type OidcAuthorizeInput = {
	state: string;
	codeChallenge: string;
	nonce: string;
};

export type OidcExchangeInput = {
	code: string;
	state: string;
	codeVerifier: string;
	nonce: string;
};

/** Raw ID token claims. Provider access/refresh/ID tokens never leave the adapter. */
export type OidcIdTokenClaims = {
	iss?: unknown;
	aud?: unknown;
	exp?: unknown;
	nonce?: unknown;
	sub?: unknown;
	email?: unknown;
	email_verified?: unknown;
	[claim: string]: unknown;
};

export type OidcProviderPort = {
	readonly key: OidcProviderKey;
	/** False when hosted OAuth is selected but not configured; start answers 503. */
	readonly available: boolean;
	readonly issuer: string;
	readonly clientId: string;
	buildAuthorizeUrl(input: OidcAuthorizeInput): Promise<string>;
	exchangeCode(input: OidcExchangeInput): Promise<OidcIdTokenClaims>;
};

export class OidcExchangeError extends Error {
	constructor(readonly reason: string) {
		super('OIDC code exchange failed');
		this.name = 'OidcExchangeError';
	}
}
