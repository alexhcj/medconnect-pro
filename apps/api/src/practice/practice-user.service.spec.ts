import {describe, expect, it, vi} from 'vitest';
import type {AuditEventRepository} from '../audit/audit-event.repository.js';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import type {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import type {PracticeRole} from '../tenancy/practice-role.js';
import type {MembershipRepository} from './membership.repository.js';
import {PracticeUserNotFoundError} from './practice-user.errors.js';
import {PracticeUserService} from './practice-user.service.js';

const actorId = '00000000-0000-4000-8000-000000000010';
const providerId = '00000000-0000-4000-8000-000000000012';
const practiceId = '00000000-0000-4000-8000-000000000001';

function membershipRow(overrides: Partial<PracticeMembership> = {}): PracticeMembership {
	return {
		id: '00000000-0000-4000-8000-0000000000aa',
		practiceId,
		userId: providerId,
		role: 'PROVIDER',
		user: {id: providerId, email: 'jordan.ellis@synthetic.example'},
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-01T00:00:00.000Z'),
		...overrides,
	} as PracticeMembership;
}

function harness(role: PracticeRole, userId = actorId) {
	const tenant = new TenantContext();
	tenant.set({practiceId, actorUserId: userId, role});
	const memberships = {
		findWithUserByUserId: vi.fn().mockResolvedValue(membershipRow()),
		countByRole: vi.fn().mockResolvedValue(1),
		updateRole: vi.fn().mockImplementation(async (row: PracticeMembership, next: PracticeRole) =>
			membershipRow({...row, role: next}),
		),
	};
	const audit = {record: vi.fn().mockResolvedValue({})};
	const request = {correlationId: 'cid-roles'} as never;
	const service = new PracticeUserService(
		memberships as unknown as MembershipRepository,
		tenant,
		audit as unknown as AuditEventRepository,
		request,
	);
	return {service, memberships, audit};
}

describe('PracticeUserService', () => {
	it('hides unknown memberships as not found', async () => {
		const admin = harness('PRACTICE_ADMIN');
		admin.memberships.findWithUserByUserId.mockResolvedValue(undefined);
		await expect(admin.service.assignRole(providerId, 'NURSE')).rejects.toBeInstanceOf(
			PracticeUserNotFoundError,
		);
		expect(admin.memberships.updateRole).not.toHaveBeenCalled();
		expect(admin.audit.record).not.toHaveBeenCalled();
	});

	it('forbids PRACTICE_ADMIN from granting SUPER_ADMIN', async () => {
		const admin = harness('PRACTICE_ADMIN');
		await expect(admin.service.assignRole(providerId, 'SUPER_ADMIN')).rejects.toBeInstanceOf(
			PermissionDeniedError,
		);
		expect(admin.memberships.updateRole).not.toHaveBeenCalled();
		expect(admin.audit.record).not.toHaveBeenCalled();
	});

	it('forbids removing the last PRACTICE_ADMIN', async () => {
		const admin = harness('PRACTICE_ADMIN', actorId);
		admin.memberships.findWithUserByUserId.mockResolvedValue(
			membershipRow({userId: actorId, role: 'PRACTICE_ADMIN'}),
		);
		admin.memberships.countByRole.mockResolvedValue(1);
		await expect(admin.service.assignRole(actorId, 'PROVIDER')).rejects.toBeInstanceOf(
			PermissionDeniedError,
		);
		expect(admin.memberships.updateRole).not.toHaveBeenCalled();
	});

	it('assigns a role and audits without secrets', async () => {
		const admin = harness('PRACTICE_ADMIN');
		const updated = await admin.service.assignRole(providerId, 'NURSE');
		expect(updated).toMatchObject({
			id: providerId,
			email: 'jordan.ellis@synthetic.example',
			role: 'NURSE',
			practiceId,
			synthetic: true,
		});
		expect(admin.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'membership.role_changed',
				resourceType: 'user',
				resourceId: providerId,
			}),
		);
		expect(JSON.stringify(admin.audit.record.mock.calls[0])).not.toMatch(
			/mfaToken|refreshToken|accessTokenHash|password/,
		);
	});

	it('returns the current membership without auditing an unchanged role', async () => {
		const admin = harness('PRACTICE_ADMIN');
		const current = await admin.service.assignRole(providerId, 'PROVIDER');
		expect(current.role).toBe('PROVIDER');
		expect(admin.memberships.updateRole).not.toHaveBeenCalled();
		expect(admin.audit.record).not.toHaveBeenCalled();
	});
});
