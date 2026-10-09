import {createHash} from 'node:crypto';
import {generateToken} from '../token.js';
import {
	OidcExchangeError,
	type OidcAuthorizeInput,
	type OidcExchangeInput,
	type OidcIdTokenClaims,
	type OidcProviderPort,
} from './oidc-provider.port.js';

export const FAKE_OIDC_ISSUER = 'https://fake-oidc.medconnect.local';
export const FAKE_OIDC_CLIENT_ID = 'medconnect-fake-client';
export const FAKE_OIDC_DEFAULT_EMAIL = 'practice.admin@example.test';
const FAKE_CODE_TTL_MS = 60_000;

type PendingCode = {
	codeChallenge: string;
	nonce: string;
	email: string;
	expiresAt: number;
};

export function pkceChallenge(verifier: string): string {
	return createHash('sha256').update(verifier, 'utf8').digest('base64url');
}

export function fakeSubjectFor(email: string): string {
	return `fake-${createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 24)}`;
}

/**
 * Local/test stand-in for an OIDC provider. Codes live in memory; PKCE is checked like a real
 * token endpoint. `overrideNextClaims` lets tests inject bad `iss`/`aud`/`nonce`/`email_verified`.
 */
export class FakeOidcAdapter implements OidcProviderPort {
	readonly key = 'fake' as const;
	readonly available = true;
	readonly issuer = FAKE_OIDC_ISSUER;
	readonly clientId = FAKE_OIDC_CLIENT_ID;
	private readonly codes = new Map<string, PendingCode>();
	private nextClaims: Partial<OidcIdTokenClaims> | undefined;

	constructor(
		private readonly authorizePath = '/auth/oauth/fake/authorize',
		private readonly defaultEmail = FAKE_OIDC_DEFAULT_EMAIL,
		private readonly now: () => number = Date.now,
	) {}

	async buildAuthorizeUrl(input: OidcAuthorizeInput): Promise<string> {
		const params = new URLSearchParams({
			state: input.state,
			code_challenge: input.codeChallenge,
			code_challenge_method: 'S256',
			nonce: input.nonce,
		});
		return `${this.authorizePath}?${params.toString()}`;
	}

	/** Fake authorize endpoint: issues a one-time code bound to the PKCE challenge and nonce. */
	authorize(input: {codeChallenge: string; nonce: string; email?: string}): string {
		const code = generateToken();
		this.codes.set(code, {
			codeChallenge: input.codeChallenge,
			nonce: input.nonce,
			email: (input.email ?? this.defaultEmail).trim().toLowerCase(),
			expiresAt: this.now() + FAKE_CODE_TTL_MS,
		});
		return code;
	}

	overrideNextClaims(claims: Partial<OidcIdTokenClaims>): void {
		this.nextClaims = claims;
	}

	async exchangeCode(input: OidcExchangeInput): Promise<OidcIdTokenClaims> {
		const pending = this.codes.get(input.code);
		this.codes.delete(input.code);
		const overrides = this.nextClaims;
		this.nextClaims = undefined;
		if (!pending || pending.expiresAt <= this.now()) {
			throw new OidcExchangeError('invalid_grant');
		}
		if (pkceChallenge(input.codeVerifier) !== pending.codeChallenge) {
			throw new OidcExchangeError('pkce_mismatch');
		}
		return {
			iss: this.issuer,
			aud: this.clientId,
			exp: Math.floor(this.now() / 1000) + 300,
			nonce: pending.nonce,
			sub: fakeSubjectFor(pending.email),
			email: pending.email,
			email_verified: true,
			...overrides,
		};
	}
}
