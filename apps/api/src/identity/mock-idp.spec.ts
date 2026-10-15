import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {
	defaultMockIdpAccounts,
	findMockIdpAccountByEmail,
	matchMockIdpAccount,
} from './mock-idp.js';

describe('mock IdP fixture', () => {
	const demoUsersPath = join(
		dirname(fileURLToPath(import.meta.url)),
		'../../../../docs/mocks/demo-users.json',
	);
	const demo = JSON.parse(readFileSync(demoUsersPath, 'utf8')) as {
		users: {email: string; password: string; role: string; userId: string}[];
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
		expect(findMockIdpAccountByEmail(defaultMockIdpAccounts, 'nobody@example.test')).toBeUndefined();
	});

	it('finds a labeled account by email without checking the password', () => {
		expect(admin).toBeDefined();
		if (!admin) {
			return;
		}
		expect(findMockIdpAccountByEmail(defaultMockIdpAccounts, admin.email.toUpperCase())).toBe(admin);
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

	it('accepts the synthetic patient password without MFA', () => {
		const patient = defaultMockIdpAccounts.find(
			(account) => account.email === 'avery.quinn@synthetic.example',
		);
		expect(patient).toMatchObject({
			password: 'Demo-Patient-1',
			role: 'PATIENT',
		});
		expect(patient?.mfaRequired).toBeUndefined();
		expect(patient?.mfaCode).toBeUndefined();
		expect(
			matchMockIdpAccount(defaultMockIdpAccounts, 'AVERY.QUINN@synthetic.example', 'Demo-Patient-1'),
		).toBe(patient);
		const fixture = demo.users.find((user) => user.email === 'avery.quinn@synthetic.example');
		expect(fixture).toMatchObject({
			email: 'avery.quinn@synthetic.example',
			password: 'Demo-Patient-1',
			role: 'PATIENT',
			userId: '77777777-7777-4777-8777-777777777777',
		});
	});

	it('leaves practice admin, provider, and MFA nurse fixtures unchanged', () => {
		expect(defaultMockIdpAccounts.filter((account) => account.role !== 'PATIENT')).toEqual([
			{
				email: 'practice.admin@example.test',
				password: 'Demo-Admin-1',
				role: 'PRACTICE_ADMIN',
			},
			{
				email: 'jordan.ellis@synthetic.example',
				password: 'Demo-Provider-1',
				role: 'PROVIDER',
			},
			{
				email: 'mfa.nurse@example.test',
				password: 'Demo-Mfa-1',
				role: 'NURSE',
				mfaRequired: true,
				mfaCode: '135790',
			},
		]);
	});
});
