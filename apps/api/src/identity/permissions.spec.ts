import {describe, expect, it} from 'vitest';
import {roleHasPermissions} from './permissions.js';

describe('permission catalog', () => {
	it('grants practice administration to practice admins', () => {
		expect(roleHasPermissions('PRACTICE_ADMIN', ['admin:users'])).toBe(true);
	});

	it('does not grant user administration to nurses', () => {
		expect(roleHasPermissions('NURSE', ['admin:users'])).toBe(false);
	});

	it('treats read:all_patients as including demographics', () => {
		expect(roleHasPermissions('PROVIDER', ['read:demographics'])).toBe(true);
	});

	it('grants global administration only to super admins', () => {
		expect(roleHasPermissions('SUPER_ADMIN', ['admin:global'])).toBe(true);
		expect(roleHasPermissions('PRACTICE_ADMIN', ['admin:global'])).toBe(false);
	});
});
