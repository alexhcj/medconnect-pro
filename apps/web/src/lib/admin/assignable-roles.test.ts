import {describe, expect, it} from 'vitest';
import {roleSelectOptions} from '@/lib/admin/assignable-roles';

describe('roleSelectOptions', () => {
	it('omits SUPER_ADMIN from grant options for a practice role', () => {
		expect(roleSelectOptions('PROVIDER')).toEqual([
			'PRACTICE_ADMIN',
			'PROVIDER',
			'NURSE',
			'RECEPTIONIST',
			'PATIENT',
		]);
	});

	it('includes SUPER_ADMIN only when it is the current membership role', () => {
		expect(roleSelectOptions('SUPER_ADMIN')[0]).toBe('SUPER_ADMIN');
		expect(roleSelectOptions('SUPER_ADMIN')).toContain('PROVIDER');
		expect(roleSelectOptions('SUPER_ADMIN').filter((role) => role === 'SUPER_ADMIN')).toHaveLength(
			1,
		);
	});
});
