import {randomUUID} from 'node:crypto';
import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {DataSource, In} from 'typeorm';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {MOCK_IDP_USERS, type MockIdpAccount} from '../src/identity/mock-idp.js';
import {configureApp} from '../src/platform/configure-app.js';
import {AuditEvent} from '../src/persistence/entities/audit-event.entity.js';
import {AuthSession} from '../src/persistence/entities/auth-session.entity.js';
import {NotificationPreference} from '../src/persistence/entities/notification-preference.entity.js';
import {Notification} from '../src/persistence/entities/notification.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {createAdminDataSource} from './admin-data-source.js';
import {RATE_LIMIT_STORE} from '../src/rate-limit/rate-limit-store.js';
import {testRateLimitStore} from './rate-limit-test-store.js';

const password = 'Synthetic-Pass-1';

describe('notification HTTP', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let practiceA: Practice;
	let practiceB: Practice;
	let provider: User;
	let nurse: User;
	let outsider: User;
	const suffix = randomUUID().slice(0, 8);

	beforeAll(async () => {
		const providerEmail = `notify.provider.${suffix}@synthetic.example`;
		const nurseEmail = `notify.nurse.${suffix}@synthetic.example`;
		const catalog: MockIdpAccount[] = [
			{email: providerEmail, password, role: 'PROVIDER'},
			{email: nurseEmail, password, role: 'NURSE'},
		];

		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(MOCK_IDP_USERS)
			.useValue(catalog)
			.overrideProvider(RATE_LIMIT_STORE)
			.useValue(testRateLimitStore)
			.compile();

		dataSource = await createAdminDataSource();
		app = moduleRef.createNestApplication();
		configureApp(app);
		await app.init();

		practiceA = await dataSource.getRepository(Practice).save({
			name: `Notify North ${suffix}`,
		});
		practiceB = await dataSource.getRepository(Practice).save({
			name: `Notify South ${suffix}`,
		});
		provider = await dataSource.getRepository(User).save({email: providerEmail});
		nurse = await dataSource.getRepository(User).save({email: nurseEmail});
		outsider = await dataSource.getRepository(User).save({
			email: `notify.outsider.${suffix}@synthetic.example`,
		});
		await dataSource.getRepository(PracticeMembership).save([
			{practiceId: practiceA.id, userId: provider.id, role: 'PROVIDER'},
			{practiceId: practiceA.id, userId: nurse.id, role: 'NURSE'},
			{practiceId: practiceB.id, userId: outsider.id, role: 'PROVIDER'},
		]);
	});

	afterAll(async () => {
		if (!dataSource?.isInitialized) {
			await app?.close();
			return;
		}
		const practiceIds = [practiceA, practiceB].filter(Boolean).map((item) => item.id);
		const users = await dataSource.getRepository(User).find({
			where: [{email: provider?.email}, {email: nurse?.email}, {email: outsider?.email}],
		});
		const userIds = users.map((user) => user.id);
		if (userIds.length > 0) {
			await dataSource.getRepository(AuditEvent).delete({actorUserId: In(userIds)});
			await dataSource.getRepository(AuthSession).delete({userId: In(userIds)});
		}
		if (practiceIds.length > 0) {
			await dataSource.getRepository(AuditEvent).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(Notification).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(NotificationPreference).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(PracticeMembership).delete({practiceId: In(practiceIds)});
		}
		if (userIds.length > 0) {
			await dataSource.getRepository(User).delete({id: In(userIds)});
		}
		if (practiceIds.length > 0) {
			await dataSource.getRepository(Practice).delete({id: In(practiceIds)});
		}
		await app?.close();
		if (dataSource?.isInitialized) {
			await dataSource.destroy();
		}
	});

	async function login(email: string): Promise<string> {
		const response = await request(app.getHttpServer())
			.post('/auth/login')
			.send({email, password})
			.expect(200);
		return response.body.accessToken as string;
	}

	async function insertInbox(input: {
		practiceId: string;
		recipientUserId: string;
		channel?: Notification['channel'];
		title?: string;
	}): Promise<Notification> {
		return dataSource.getRepository(Notification).save({
			practiceId: input.practiceId,
			recipientUserId: input.recipientUserId,
			channel: input.channel ?? 'in_app',
			type: 'generic',
			title: input.title ?? 'Appointment updated',
			body: 'Your visit time changed.',
			status: 'delivered',
			attemptCount: 0,
			lastAttemptAt: null,
			deliveredAt: new Date('2026-09-27T12:00:00.000Z'),
			readAt: null,
			synthetic: true,
		});
	}

	it('rejects anonymous access', async () => {
		const anonymous = await request(app.getHttpServer()).get('/notifications').expect(401);
		expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');
	});

	it('returns default preferences and updates own flags with audit without payload text', async () => {
		const token = await login(provider.email);
		const defaults = await request(app.getHttpServer())
			.get('/notifications/preferences')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(defaults.body).toMatchObject({
			practiceId: practiceA.id,
			userId: provider.id,
			inAppEnabled: true,
			emailEnabled: true,
			smsEnabled: true,
			synthetic: true,
		});

		const updated = await request(app.getHttpServer())
			.patch('/notifications/preferences')
			.set('Authorization', `Bearer ${token}`)
			.set('X-Correlation-ID', `cid-notify-pref-${suffix}`)
			.send({emailEnabled: false})
			.expect(200);
		expect(updated.body.emailEnabled).toBe(false);
		expect(updated.body.inAppEnabled).toBe(true);

		const audits = await dataSource.getRepository(AuditEvent).find({
			where: {
				practiceId: practiceA.id,
				action: 'notification_preference.updated',
			},
		});
		expect(audits.length).toBeGreaterThan(0);
		expect(JSON.stringify(audits[0])).not.toMatch(/Appointment updated|visit time|title|body/i);
		expect(audits[0]?.correlationId).toBe(`cid-notify-pref-${suffix}`);
	});

	it('lists own in-app rows, hides email ledger and other users, and marks read', async () => {
		const own = await insertInbox({practiceId: practiceA.id, recipientUserId: provider.id});
		const other = await insertInbox({
			practiceId: practiceA.id,
			recipientUserId: nurse.id,
			title: 'Nurse only',
		});
		const emailRow = await insertInbox({
			practiceId: practiceA.id,
			recipientUserId: provider.id,
			channel: 'email',
			title: 'Email ledger',
		});

		const token = await login(provider.email);
		const listed = await request(app.getHttpServer())
			.get('/notifications')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		const ids = listed.body.notifications.map((row: {id: string}) => row.id);
		expect(ids).toContain(own.id);
		expect(ids).not.toContain(other.id);
		expect(ids).not.toContain(emailRow.id);
		expect(listed.body.notifications.every((row: {synthetic: boolean}) => row.synthetic)).toBe(true);

		const read = await request(app.getHttpServer())
			.patch(`/notifications/${own.id}/read`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(read.body.readAt).toBeTruthy();

		const hidden = await request(app.getHttpServer())
			.patch(`/notifications/${other.id}/read`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(hidden.body.error.code).toBe('NOT_FOUND');
		expect(JSON.stringify(hidden.body)).not.toContain('Nurse only');

		const notInbox = await request(app.getHttpServer())
			.patch(`/notifications/${emailRow.id}/read`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(notInbox.body.error.code).toBe('NOT_FOUND');
	});

	it('hides cross-tenant rows and rejects a client practice id', async () => {
		const foreign = await insertInbox({
			practiceId: practiceB.id,
			recipientUserId: outsider.id,
			title: 'Foreign inbox',
		});
		const token = await login(provider.email);
		const missing = await request(app.getHttpServer())
			.patch(`/notifications/${foreign.id}/read`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(missing.body.error.code).toBe('NOT_FOUND');
		expect(JSON.stringify(missing.body)).not.toContain(practiceB.id);

		const mismatch = await request(app.getHttpServer())
			.patch('/notifications/preferences')
			.set('Authorization', `Bearer ${token}`)
			.send({smsEnabled: false, practiceId: practiceB.id})
			.expect(403);
		expect(mismatch.body.error.code).toBe('FORBIDDEN');
		expect(JSON.stringify(mismatch.body)).not.toContain(practiceB.id);
	});
});
