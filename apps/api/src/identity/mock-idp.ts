import type {PracticeRole} from '../tenancy/practice-role.js';
import {constantTimeEqual} from './token.js';

export const MOCK_IDP_USERS = Symbol('MOCK_IDP_USERS');

/**
 * Labeled mock IdP accounts. Passwords stay in this fixture; the users table has no password column.
 * `role` documents the intended membership and is not an authorization source.
 */
export type MockIdpAccount = {
	email: string;
	password: string;
	role: PracticeRole;
	mfaRequired?: boolean;
	mfaCode?: string;
};

export const defaultMockIdpAccounts: readonly MockIdpAccount[] = [
	{
		email: 'practice.admin@example.test',
		password: 'Demo-Admin-1',
		role: 'PRACTICE_ADMIN',
	},
	{
		email: 'mfa.nurse@example.test',
		password: 'Demo-Mfa-1',
		role: 'NURSE',
		mfaRequired: true,
		mfaCode: '135790',
	},
];

export function matchMockIdpAccount(
	accounts: readonly MockIdpAccount[],
	email: string,
	password: string,
): MockIdpAccount | undefined {
	const normalized = email.trim().toLowerCase();
	const account = accounts.find((item) => item.email.toLowerCase() === normalized);
	if (!account || !constantTimeEqual(password, account.password)) {
		return undefined;
	}
	return account;
}
