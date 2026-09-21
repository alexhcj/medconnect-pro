import {describe, expect, it} from 'vitest';
import {DEFAULT_ROLE_PERMISSIONS, isPermission, PERMISSIONS} from '@/types/auth/permissions';
import {ROLES} from '@/types/auth/roles';

describe('permission catalog', () => {
	it('recognizes only catalog strings', () => {
		expect(isPermission('read:all_patients')).toBe(true);
		expect(isPermission('read')).toBe(false);
		expect(isPermission('admin')).toBe(false);
	});

	it('gives every role a subset of the catalog', () => {
		for (const role of ROLES) {
			const grants = DEFAULT_ROLE_PERMISSIONS[role];
			expect(grants.length).toBeGreaterThan(0);
			for (const permission of grants) {
				expect(PERMISSIONS).toContain(permission);
			}
		}
	});

	it('does not grant clinical writes to PRACTICE_ADMIN by default', () => {
		expect(DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN).not.toContain('write:medical_records');
		expect(DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN).not.toContain('write:vitals');
	});
});
