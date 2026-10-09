import {randomUUID} from 'node:crypto';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {DataSource, In} from 'typeorm';
import {ExternalIdentityRepository} from '../src/identity/external-identity.repository.js';
import {OAuthFlowStateRepository} from '../src/identity/oauth-flow-state.repository.js';
import {generateToken, hashToken} from '../src/identity/token.js';
import {ExternalIdentity} from '../src/persistence/entities/external-identity.entity.js';
import {OAuthFlowState} from '../src/persistence/entities/oauth-flow-state.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {createAdminDataSource, createAppDataSource} from './admin-data-source.js';

const TABLES = ['external_identities', 'oauth_flow_states'];

describe('External identity persistence', () => {
	let admin: DataSource;
	let app: DataSource;
	let identities: ExternalIdentityRepository;
	let flows: OAuthFlowStateRepository;
	let userA: User;
	let userB: User;
	const provider = `fake-${randomUUID().slice(0, 8)}`;
	const stateHashes: string[] = [];

	beforeAll(async () => {
		admin = await createAdminDataSource();
		app = await createAppDataSource();
		identities = new ExternalIdentityRepository(app.getRepository(ExternalIdentity));
		flows = new OAuthFlowStateRepository(app.getRepository(OAuthFlowState));
		const suffix = randomUUID();
		userA = await admin.getRepository(User).save({email: `ext.a.${suffix}@synthetic.example`});
		userB = await admin.getRepository(User).save({email: `ext.b.${suffix}@synthetic.example`});
	});

	afterAll(async () => {
		await admin.getRepository(ExternalIdentity).delete({provider});
		await admin.getRepository(OAuthFlowState).delete({stateHash: In(stateHashes)});
		await admin.getRepository(User).delete({id: In([userA.id, userB.id])});
		await app.destroy();
		await admin.destroy();
	});

	function newFlow(expiresAt: Date) {
		const state = generateToken();
		const stateHash = hashToken(state);
		stateHashes.push(stateHash);
		return {
			state,
			input: {
				provider,
				stateHash,
				codeVerifier: generateToken(),
				nonce: generateToken(),
				returnTo: '/dashboard',
				expiresAt,
			},
		};
	}

	it('links and finds an external identity as the runtime role', async () => {
		const link = await identities.insert({
			userId: userA.id,
			provider,
			subject: 'sub-a',
			emailAtLink: userA.email,
		});
		expect((await identities.findByProviderSubject(provider, 'sub-a'))?.id).toBe(link.id);
		expect((await identities.findByUserProvider(userA.id, provider))?.id).toBe(link.id);
		expect(await identities.findByProviderSubject(provider, 'missing')).toBeUndefined();
	});

	it('rejects duplicate (provider, subject) and (user_id, provider)', async () => {
		await expect(
			identities.insert({userId: userB.id, provider, subject: 'sub-a', emailAtLink: null}),
		).rejects.toMatchObject({driverError: {code: '23505'}});
		await expect(
			identities.insert({userId: userA.id, provider, subject: 'sub-other', emailAtLink: null}),
		).rejects.toMatchObject({driverError: {code: '23505'}});
	});

	it('consumes flow state exactly once and stores only the state hash', async () => {
		const now = new Date();
		const {state, input} = newFlow(new Date(now.getTime() + 60_000));
		const created = await flows.create(input, now);
		expect(created.stateHash).toMatch(/^[0-9a-f]{64}$/);
		expect(created.stateHash).not.toBe(state);

		const first = await flows.consume(input.stateHash, now);
		expect(first?.id).toBe(created.id);
		expect(first?.consumedAt).not.toBeNull();
		expect(await flows.consume(input.stateHash, now)).toBeUndefined();
		expect(await flows.consume(hashToken(state + 'x'), now)).toBeUndefined();
	});

	it('rejects expired flow state and deletes expired rows on create', async () => {
		const now = new Date();
		const expired = newFlow(new Date(now.getTime() - 1_000));
		await admin.getRepository(OAuthFlowState).insert(expired.input);
		expect(await flows.consume(expired.input.stateHash, now)).toBeUndefined();

		await flows.create(newFlow(new Date(now.getTime() + 60_000)).input, now);
		const remaining = await admin
			.getRepository(OAuthFlowState)
			.findOne({where: {stateHash: expired.input.stateHash}});
		expect(remaining).toBeNull();
	});

	it('adds no row-level security to either table', async () => {
		const rls = (await admin.query(
			`SELECT relname, relrowsecurity FROM pg_class WHERE relname = ANY($1)`,
			[TABLES],
		)) as Array<{relname: string; relrowsecurity: boolean}>;
		expect(rls).toHaveLength(2);
		expect(rls.every((row) => !row.relrowsecurity)).toBe(true);
		const policies = (await admin.query(`SELECT 1 FROM pg_policies WHERE tablename = ANY($1)`, [
			TABLES,
		])) as unknown[];
		expect(policies).toHaveLength(0);
	});
});
