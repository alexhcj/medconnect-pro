import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {defaultMockIdpAccounts, matchMockIdpAccount} from './mock-idp.js';

describe('mock IdP fixture', () => {
	const demoUsersPath = join(
		dirname(fileURLToPath(import.meta.url)),
		'../../../../docs/mocks/demo-users.json',
	);
	const demo = JSON.parse(readFileSync(demoUsersPath, 'utf8')) as {
		users: {email: string; password: string; role: string}[];
	};
	const admin = defaultMockIdpAccounts.find((account) => account.email === demo.users[0]?.email);

	it('matches the labeled FE-010 demo account', () => {
		expect(admin).toMatchObject({
			email: demo.users[0]?.email,
			password: demo.users[0]?.password,
			role: demo.users[0]?.role,
		});
	});

	it('accepts the demo password and rejects a different one', () => {
		expect(admin).toBeDefined();
		if (!admin) {
			return;
		}
		expect(matchMockIdpAccount(defaultMockIdpAccounts, admin.email.toUpperCase(), admin.password)).toBe(
			admin,
		);
		expect(
			matchMockIdpAccount(defaultMockIdpAccounts, admin.email, `${admin.password}-nope`),
		).toBeUndefined();
	});

	it('rejects unknown emails', () => {
		expect(
			matchMockIdpAccount(defaultMockIdpAccounts, 'nobody@example.test', 'Synthetic-Pass-1'),
		).toBeUndefined();
	});

	it('includes a test-only MFA account', () => {
		expect(defaultMockIdpAccounts.some((account) => account.mfaRequired && account.mfaCode)).toBe(
			true,
		);
	});

	it('accepts the live demo provider password', () => {
		const provider = defaultMockIdpAccounts.find(
			(account) => account.email === 'jordan.ellis@synthetic.example',
		);
		expect(provider).toMatchObject({
			password: 'Demo-Provider-1',
			role: 'PROVIDER',
		});
		expect(matchMockIdpAccount(defaultMockIdpAccounts, provider?.email ?? '', provider?.password ?? '')).toBe(
			provider,
		);
	});
});
