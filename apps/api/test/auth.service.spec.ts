import {randomUUID} from 'node:crypto';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {DataSource, In} from 'typeorm';
import type {AuditEventRepository} from '../src/audit/audit-event.repository.js';
import {AuthService, type LoginResult, type TokenPair} from '../src/identity/auth.service.js';
import {InvalidCredentialsError, MembershipUnresolvedError, MfaInvalidError, SessionInvalidError} from '../src/identity/auth.errors.js';
import type {Clock} from '../src/identity/clock.js';
import type {MockIdpAccount} from '../src/identity/mock-idp.js';
import {IdentityMembershipLookup} from '../src/identity/membership-lookup.js';
import {SessionRepository} from '../src/identity/session.repository.js';
import {ACCESS_TTL_MS, IDLE_TTL_MS, MFA_TTL_MS} from '../src/identity/session-policy.js';
import {hashToken} from '../src/identity/token.js';
import {DEFAULT_DATABASE_URL} from '../src/persistence/default-database-url.js';
import {AuthSession} from '../src/persistence/entities/auth-session.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {postgresConnectionOptions} from '../src/persistence/typeorm.options.js';
import {TenantMismatchError} from '../src/tenancy/tenant-errors.js';

const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
const password = 'Synthetic-Pass-1';
const mfaCode = '246810';

function expectTokens(result: LoginResult): TokenPair {
	expect(result.kind).toBe('tokens');
	if (result.kind !== 'tokens') {
		throw new Error('expected token pair');
	}
	return result;
}

describe('AuthService', () => {
	let dataSource: DataSource;
	let service: AuthService;
	let audit: {record: ReturnType<typeof vi.fn>};
	let now = new Date('2026-03-01T12:00:00.000Z');
	let practiceA: Practice;
	let practiceB: Practice;
	let singleUser: User;
	let multiUser: User;
	let mfaUser: User;
	let orphanUser: User;
	let singleMembership: PracticeMembership;
	let multiMembershipB: PracticeMembership;

	const clock: Clock = {
		now: () => now,
	};

	beforeAll(async () => {
		const suffix = randomUUID();
		const singleEmail = `single.${suffix}@synthetic.example`;
		const multiEmail = `multi.${suffix}@synthetic.example`;
		const mfaEmail = `mfa.${suffix}@synthetic.example`;
		const orphanEmail = `orphan.${suffix}@synthetic.example`;
		const catalog: MockIdpAccount[] = [
			{email: singleEmail, password, role: 'PROVIDER'},
			{email: multiEmail, password, role: 'SUPER_ADMIN'},
			{email: mfaEmail, password, role: 'NURSE', mfaRequired: true, mfaCode},
			{email: orphanEmail, password, role: 'RECEPTIONIST'},
		];

		dataSource = new DataSource(postgresConnectionOptions(databaseUrl));
		try {
			await dataSource.initialize();
		} catch (error) {
			throw new Error(
				`PostgreSQL is required for API tests. Start it with docker compose up -d. DATABASE_URL=${databaseUrl}`,
				{cause: error},
			);
		}
		await dataSource.runMigrations();

		practiceA = await dataSource.getRepository(Practice).save({
			name: `Harbor Synthetic ${suffix}`,
		});
		practiceB = await dataSource.getRepository(Practice).save({
			name: `Inlet Synthetic ${suffix}`,
		});
		singleUser = await dataSource.getRepository(User).save({email: singleEmail});
		multiUser = await dataSource.getRepository(User).save({email: multiEmail});
		mfaUser = await dataSource.getRepository(User).save({email: mfaEmail});
		orphanUser = await dataSource.getRepository(User).save({email: orphanEmail});
		singleMembership = await dataSource.getRepository(PracticeMembership).save({
			practiceId: practiceA.id,
			userId: singleUser.id,
			role: 'PROVIDER',
		});
		await dataSource.getRepository(PracticeMembership).save({
			practiceId: practiceA.id,
			userId: multiUser.id,
			role: 'SUPER_ADMIN',
		});
		multiMembershipB = await dataSource.getRepository(PracticeMembership).save({
			practiceId: practiceB.id,
			userId: multiUser.id,
			role: 'SUPER_ADMIN',
		});
		await dataSource.getRepository(PracticeMembership).save({
			practiceId: practiceA.id,
			userId: mfaUser.id,
			role: 'NURSE',
		});

		const sessions = new SessionRepository(dataSource.getRepository(AuthSession));
		const memberships = new IdentityMembershipLookup(
			dataSource.getRepository(User),
			dataSource.getRepository(PracticeMembership),
		);
		audit = {record: vi.fn().mockResolvedValue({})};
		const request = {path: '/auth/login'} as never;
		service = new AuthService(
			sessions,
			memberships,
			catalog,
			clock,
			audit as unknown as AuditEventRepository,
			request,
		);
	});

	afterAll(async () => {
		if (!dataSource?.isInitialized) {
			return;
		}
		const userIds = [singleUser, multiUser, mfaUser, orphanUser].filter(Boolean).map((user) => user.id);
		if (userIds.length > 0) {
			await dataSource.getRepository(AuthSession).delete({userId: In(userIds)});
			await dataSource.getRepository(PracticeMembership).delete({userId: In(userIds)});
			await dataSource.getRepository(User).delete({id: In(userIds)});
		}
		const practiceIds = [practiceA, practiceB].filter(Boolean).map((practice) => practice.id);
		if (practiceIds.length > 0) {
			await dataSource.getRepository(Practice).delete({id: In(practiceIds)});
		}
		await dataSource.destroy();
	});

	it('rejects unknown credentials and accounts with no membership', async () => {
		await expect(
			service.login({email: 'missing@synthetic.example', password}),
		).rejects.toBeInstanceOf(InvalidCredentialsError);
		await expect(service.login({email: singleUser.email, password: 'wrong-password-1'})).rejects.toBeInstanceOf(
			InvalidCredentialsError,
		);
		await expect(service.login({email: orphanUser.email, password})).rejects.toBeInstanceOf(
			InvalidCredentialsError,
		);
	});

	it('binds the only membership and stores token hashes', async () => {
		now = new Date('2026-03-01T12:00:00.000Z');
		const tokens = expectTokens(await service.login({email: singleUser.email, password}));
		const row = await dataSource.getRepository(AuthSession).findOneByOrFail({
			accessTokenHash: hashToken(tokens.accessToken),
		});
		expect(row.membershipId).toBe(singleMembership.id);
		expect(row.accessTokenHash).not.toBe(tokens.accessToken);
		expect(row.refreshTokenHash).toBe(hashToken(tokens.refreshToken));
		const resolved = await service.authenticate(tokens.accessToken);
		expect(resolved.membership.practiceId).toBe(practiceA.id);
		expect(resolved.membership.role).toBe('PROVIDER');
		expect(audit.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'auth.login.succeeded',
				resourceType: 'session',
			}),
			expect.objectContaining({practiceId: practiceA.id, actorUserId: singleUser.id}),
		);
		expect(JSON.stringify(audit.record.mock.calls)).not.toMatch(/synthetic\.example|Synthetic-Pass/);
	});

	it('rejects a practice selector outside the membership set', async () => {
		now = new Date('2026-03-01T12:05:00.000Z');
		await expect(
			service.login({email: singleUser.email, password, practiceId: practiceB.id}),
		).rejects.toBeInstanceOf(TenantMismatchError);
	});

	it('fails closed when several memberships exist and none is selected', async () => {
		now = new Date('2026-03-01T12:10:00.000Z');
		await expect(service.login({email: multiUser.email, password})).rejects.toBeInstanceOf(
			MembershipUnresolvedError,
		);
		const tokens = expectTokens(
			await service.login({email: multiUser.email, password, practiceId: practiceB.id}),
		);
		const resolved = await service.authenticate(tokens.accessToken);
		expect(resolved.membership.id).toBe(multiMembershipB.id);
	});

	it('rejects an access token after the access lifetime', async () => {
		now = new Date('2026-03-01T13:00:00.000Z');
		const tokens = expectTokens(await service.login({email: singleUser.email, password}));
		now = new Date(now.getTime() + ACCESS_TTL_MS);
		await expect(service.authenticate(tokens.accessToken)).rejects.toBeInstanceOf(SessionInvalidError);
	});

	it('rotates refresh tokens and revokes the session when a rotated token is reused', async () => {
		now = new Date('2026-03-01T14:00:00.000Z');
		const first = expectTokens(await service.login({email: singleUser.email, password}));
		now = new Date(now.getTime() + 60_000);
		const second = await service.refresh(first.refreshToken);
		await expect(service.authenticate(second.accessToken)).resolves.toMatchObject({
			membership: {practiceId: practiceA.id},
		});
		await expect(service.refresh(first.refreshToken)).rejects.toBeInstanceOf(SessionInvalidError);
		await expect(service.authenticate(second.accessToken)).rejects.toBeInstanceOf(SessionInvalidError);
	});

	it('rejects refresh after the idle window', async () => {
		now = new Date('2026-03-01T15:00:00.000Z');
		const tokens = expectTokens(await service.login({email: singleUser.email, password}));
		now = new Date(now.getTime() + IDLE_TTL_MS);
		await expect(service.refresh(tokens.refreshToken)).rejects.toBeInstanceOf(SessionInvalidError);
	});

	it('revokes every session for the user on logout-all', async () => {
		now = new Date('2026-03-01T16:00:00.000Z');
		const first = expectTokens(await service.login({email: singleUser.email, password}));
		const second = expectTokens(await service.login({email: singleUser.email, password}));
		await service.logoutAll(singleUser.id);
		await expect(service.authenticate(first.accessToken)).rejects.toBeInstanceOf(SessionInvalidError);
		await expect(service.authenticate(second.accessToken)).rejects.toBeInstanceOf(SessionInvalidError);
	});

	it('issues tokens only after the mock MFA code is accepted', async () => {
		now = new Date('2026-03-01T17:00:00.000Z');
		const challenge = await service.login({email: mfaUser.email, password});
		expect(challenge.kind).toBe('mfa');
		if (challenge.kind !== 'mfa') {
			return;
		}
		await expect(service.verifyMfa(challenge.mfaToken, '000000')).rejects.toBeInstanceOf(MfaInvalidError);
		const tokens = await service.verifyMfa(challenge.mfaToken, mfaCode);
		await expect(service.authenticate(tokens.accessToken)).resolves.toMatchObject({
			membership: {role: 'NURSE'},
		});
		await expect(service.verifyMfa(challenge.mfaToken, mfaCode)).rejects.toBeInstanceOf(MfaInvalidError);

		const expired = await service.login({email: mfaUser.email, password});
		if (expired.kind !== 'mfa') {
			throw new Error('expected MFA challenge');
		}
		now = new Date(now.getTime() + MFA_TTL_MS);
		await expect(service.verifyMfa(expired.mfaToken, mfaCode)).rejects.toBeInstanceOf(MfaInvalidError);
	});
});
