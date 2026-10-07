import {randomUUID} from 'node:crypto';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {DataSource, In} from 'typeorm';
import {AuditEvent} from '../persistence/entities/audit-event.entity.js';
import {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import {Practice} from '../persistence/entities/practice.entity.js';
import {User} from '../persistence/entities/user.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {createAdminDataSource} from '../../test/admin-data-source.js';
import {AuditEventRepository} from './audit-event.repository.js';

describe('AuditEventRepository', () => {
	let dataSource: DataSource;
	let tenant: TenantContext;
	let repo: AuditEventRepository;
	let practiceA: Practice;
	let practiceB: Practice;
	let userA: User;
	let userB: User;

	beforeAll(async () => {
		const suffix = randomUUID().slice(0, 8);
		dataSource = await createAdminDataSource();
		practiceA = await dataSource.getRepository(Practice).save({name: `Audit Repo A ${suffix}`});
		practiceB = await dataSource.getRepository(Practice).save({name: `Audit Repo B ${suffix}`});
		userA = await dataSource.getRepository(User).save({
			email: `audit.repo.a.${suffix}@synthetic.example`,
		});
		userB = await dataSource.getRepository(User).save({
			email: `audit.repo.b.${suffix}@synthetic.example`,
		});
		await dataSource.getRepository(PracticeMembership).save([
			{practiceId: practiceA.id, userId: userA.id, role: 'PRACTICE_ADMIN'},
			{practiceId: practiceB.id, userId: userB.id, role: 'PRACTICE_ADMIN'},
		]);
		tenant = new TenantContext();
		repo = new AuditEventRepository(dataSource.getRepository(AuditEvent), tenant);
	});

	afterAll(async () => {
		if (!dataSource?.isInitialized) {
			return;
		}
		const practiceIds = [practiceA, practiceB].filter(Boolean).map((item) => item.id);
		const userIds = [userA, userB].filter(Boolean).map((item) => item.id);
		if (practiceIds.length > 0) {
			await dataSource.getRepository(AuditEvent).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(PracticeMembership).delete({practiceId: In(practiceIds)});
		}
		if (userIds.length > 0) {
			await dataSource.getRepository(User).delete({id: In(userIds)});
		}
		if (practiceIds.length > 0) {
			await dataSource.getRepository(Practice).delete({id: In(practiceIds)});
		}
		await dataSource.destroy();
	});

	it('lists only the resolved practice and accepts an explicit actor scope', async () => {
		tenant.set({
			practiceId: practiceA.id,
			actorUserId: userA.id,
			role: 'PRACTICE_ADMIN',
		});
		await repo.record({
			action: 'patient.accessed',
			resourceType: 'patient',
			resourceId: null,
			correlationId: 'cid-a',
		});
		await repo.record(
			{
				action: 'auth.login.succeeded',
				resourceType: 'session',
				resourceId: null,
				correlationId: 'cid-b',
			},
			{practiceId: practiceB.id, actorUserId: userB.id},
		);

		const page = await repo.list({});
		expect(page.events.length).toBeGreaterThan(0);
		expect(page.events.every((event) => event.practiceId === practiceA.id)).toBe(true);
		expect(page.events.some((event) => event.action === 'patient.accessed')).toBe(true);
		expect(page.events.some((event) => event.action === 'auth.login.succeeded')).toBe(false);
	});

	it('lists auth.* rows only when an action prefix is set', async () => {
		tenant.set({
			practiceId: practiceA.id,
			actorUserId: userA.id,
			role: 'PRACTICE_ADMIN',
		});
		await repo.record({
			action: 'auth.login.failed',
			resourceType: 'session',
			resourceId: null,
			correlationId: 'cid-failed',
		});
		await repo.record({
			action: 'access.denied',
			resourceType: 'admin',
			resourceId: null,
			correlationId: 'cid-denied',
		});

		const security = await repo.list({actionPrefix: 'auth.'});
		expect(security.events.length).toBeGreaterThan(0);
		expect(security.events.every((event) => event.action.startsWith('auth.'))).toBe(true);
		expect(security.events.some((event) => event.action === 'auth.login.failed')).toBe(true);
		expect(security.events.some((event) => event.action === 'access.denied')).toBe(false);

		const exactNonAuth = await repo.list({
			actionPrefix: 'auth.',
			action: 'patient.accessed',
		});
		expect(exactNonAuth.events).toHaveLength(0);
	});
});
