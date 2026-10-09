import * as client from 'openid-client';
import {
	OidcExchangeError,
	type OidcAuthorizeInput,
	type OidcExchangeInput,
	type OidcIdTokenClaims,
	type OidcProviderPort,
} from './oidc-provider.port.js';

export type GoogleOidcConfig = {
	issuer: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
};

/** Confidential OIDC client. Provider tokens are reduced to ID token claims and discarded. */
export class GoogleOidcAdapter implements OidcProviderPort {
	readonly key = 'google' as const;
	readonly available = true;
	readonly issuer: string;
	readonly clientId: string;
	private configuration: Promise<client.Configuration> | undefined;

	constructor(
		private readonly config: GoogleOidcConfig,
		private readonly discover: typeof client.discovery = client.discovery,
	) {
		this.issuer = config.issuer;
		this.clientId = config.clientId;
	}

	private resolveConfiguration(): Promise<client.Configuration> {
		this.configuration ??= this.discover(
			new URL(this.config.issuer),
			this.config.clientId,
			this.config.clientSecret,
		).catch((error: unknown) => {
			this.configuration = undefined;
			throw error;
		});
		return this.configuration;
	}

	async buildAuthorizeUrl(input: OidcAuthorizeInput): Promise<string> {
		const configuration = await this.resolveConfiguration();
		return client
			.buildAuthorizationUrl(configuration, {
				redirect_uri: this.config.redirectUri,
				scope: 'openid email',
				response_type: 'code',
				code_challenge: input.codeChallenge,
				code_challenge_method: 'S256',
				state: input.state,
				nonce: input.nonce,
			})
			.toString();
	}

	async exchangeCode(input: OidcExchangeInput): Promise<OidcIdTokenClaims> {
		const configuration = await this.resolveConfiguration();
		const callbackUrl = new URL(this.config.redirectUri);
		callbackUrl.searchParams.set('code', input.code);
		callbackUrl.searchParams.set('state', input.state);
		try {
			const tokens = await client.authorizationCodeGrant(configuration, callbackUrl, {
				pkceCodeVerifier: input.codeVerifier,
				expectedState: input.state,
				expectedNonce: input.nonce,
				idTokenExpected: true,
			});
			const claims = tokens.claims();
			if (!claims) {
				throw new OidcExchangeError('id_token_missing');
			}
			return {...claims};
		} catch (error) {
			if (error instanceof OidcExchangeError) {
				throw error;
			}
			throw new OidcExchangeError('token_exchange_failed');
		}
	}
}
