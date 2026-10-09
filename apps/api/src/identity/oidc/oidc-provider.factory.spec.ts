import {describe, expect, it} from 'vitest';
import {FakeOidcAdapter, pkceChallenge} from './fake-oidc.adapter.js';
import {GoogleOidcAdapter} from './google-oidc.adapter.js';
import {createOidcProvider, UnavailableOidcAdapter} from './oidc-provider.factory.js';
import {OidcExchangeError} from './oidc-provider.port.js';

const google = {
	OIDC_ISSUER: 'https://accounts.google.com',
	OIDC_CLIENT_ID: 'placeholder-client-id',
	OIDC_CLIENT_SECRET: 'placeholder-secret',
	OIDC_REDIRECT_URI: 'http://localhost:3001/auth/oauth/google/callback',
};

describe('createOidcProvider', () => {
	it('selects Fake locally when Google env is unset', () => {
		expect(createOidcProvider({APP_ENV: 'local'})).toBeInstanceOf(FakeOidcAdapter);
	});

	it('selects Google when fully configured', () => {
		expect(createOidcProvider({APP_ENV: 'preview', ...google})).toBeInstanceOf(GoogleOidcAdapter);
	});

	it('never selects Fake when hosted', () => {
		const preview = createOidcProvider({APP_ENV: 'preview', OIDC_PROVIDER: 'fake'});
		expect(preview).toBeInstanceOf(UnavailableOidcAdapter);
		expect(preview.available).toBe(false);
	});

	it('is unavailable when hosted Google lacks a secret', () => {
		const {OIDC_CLIENT_SECRET: _omit, ...partial} = google;
		const provider = createOidcProvider({APP_ENV: 'production', OIDC_PROVIDER: 'google', ...partial});
		expect(provider.available).toBe(false);
		expect(provider.key).toBe('google');
	});
});

describe('FakeOidcAdapter', () => {
	it('enforces PKCE and single-use codes', async () => {
		const adapter = new FakeOidcAdapter();
		const verifier = 'verifier-value-with-enough-entropy-000000000';
		const code = adapter.authorize({codeChallenge: pkceChallenge(verifier), nonce: 'n1'});
		await expect(
			adapter.exchangeCode({code, state: 's', codeVerifier: 'wrong', nonce: 'n1'}),
		).rejects.toBeInstanceOf(OidcExchangeError);
		await expect(
			adapter.exchangeCode({code, state: 's', codeVerifier: verifier, nonce: 'n1'}),
		).rejects.toBeInstanceOf(OidcExchangeError);

		const fresh = adapter.authorize({codeChallenge: pkceChallenge(verifier), nonce: 'n2'});
		const claims = await adapter.exchangeCode({
			code: fresh,
			state: 's',
			codeVerifier: verifier,
			nonce: 'n2',
		});
		expect(claims).toMatchObject({nonce: 'n2', email_verified: true, aud: adapter.clientId});
	});
});
