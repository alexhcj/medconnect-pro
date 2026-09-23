import {Logger} from '@nestjs/common';
import {DataSource} from 'typeorm';
import {Patient} from '../persistence/entities/patient.entity.js';
import {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import {Practice} from '../persistence/entities/practice.entity.js';
import {User} from '../persistence/entities/user.entity.js';
import {DEFAULT_DATABASE_URL} from '../persistence/default-database-url.js';
import {postgresConnectionOptions} from '../persistence/typeorm.options.js';
import {defaultMockIdpAccounts} from './mock-idp.js';

const DEMO_EMAIL = 'practice.admin@example.test';
const PRACTICE_NAME = 'Harbor Synthetic Practice';

/**
 * Stable synthetic provider for the live patient form.
 * Must match `LIVE_DEMO_PROVIDER_ID` in `apps/web/src/lib/api/live-demo-provider.ts`.
 */
export const LIVE_DEMO_PROVIDER_ID = '11111111-1111-4111-8111-111111111111';
const PROVIDER_EMAIL = 'jordan.ellis@synthetic.example';

const SEEDED_PATIENTS = [
	{
		firstName: 'Avery',
		lastName: 'Quinn',
		dateOfBirth: '1988-04-12',
		gender: 'female' as const,
		status: 'active' as const,
		phone: '555-0100',
		email: 'avery.quinn@synthetic.example',
		street: '100 Demo Street',
		city: 'Harborview',
		state: 'WA',
		postalCode: '98101',
		emergencyContactName: 'Sky Quinn',
		emergencyContactRelationship: 'Sibling',
		emergencyContactPhone: '555-0101',
		insuranceProvider: 'Synthetic Health Plan',
		insurancePolicyNumber: 'SYN-100',
		insuranceGroupNumber: 'GRP-1',
	},
	{
		firstName: 'Blake',
		lastName: 'Chen',
		dateOfBirth: '1992-11-02',
		gender: 'male' as const,
		status: 'active' as const,
		phone: '555-0102',
		email: 'blake.chen@synthetic.example',
		street: '200 Demo Street',
		city: 'Harborview',
		state: 'WA',
		postalCode: '98101',
		emergencyContactName: 'Rowan Chen',
		emergencyContactRelationship: 'Parent',
		emergencyContactPhone: '555-0103',
		insuranceProvider: 'Synthetic Health Plan',
		insurancePolicyNumber: 'SYN-200',
		insuranceGroupNumber: 'GRP-1',
	},
];

function safeError(error: unknown): string {
	if (!(error instanceof Error)) {
		return 'Seed failed';
	}
	const message = error.message.toLowerCase();
	if (message.includes('://') || message.includes('password')) {
		return error.name;
	}
	return error.message;
}

async function seed(): Promise<void> {
	const account = defaultMockIdpAccounts.find((item) => item.email === DEMO_EMAIL);
	if (!account) {
		throw new Error('Demo mock IdP account is missing');
	}

	const dataSource = new DataSource(
		postgresConnectionOptions(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL),
	);
	await dataSource.initialize();
	try {
		await dataSource.runMigrations();
		const users = dataSource.getRepository(User);
		const practices = dataSource.getRepository(Practice);
		const memberships = dataSource.getRepository(PracticeMembership);
		const patients = dataSource.getRepository(Patient);

		let admin = await users.findOne({where: {email: account.email}});
		if (!admin) {
			admin = await users.save({email: account.email});
		}

		let membership = await memberships.findOne({where: {userId: admin.id}});
		let practice: Practice | null = null;
		if (membership) {
			practice = await practices.findOne({where: {id: membership.practiceId}});
		}
		if (!practice) {
			practice = await practices.findOne({where: {name: PRACTICE_NAME}});
		}
		if (!practice) {
			practice = await practices.save({name: PRACTICE_NAME});
		}
		if (!membership) {
			await memberships.save({
				practiceId: practice.id,
				userId: admin.id,
				role: account.role,
			});
		}

		let provider = await users.findOne({where: {id: LIVE_DEMO_PROVIDER_ID}});
		if (!provider) {
			provider = await users.findOne({where: {email: PROVIDER_EMAIL}});
		}
		if (!provider) {
			provider = await users.save({id: LIVE_DEMO_PROVIDER_ID, email: PROVIDER_EMAIL});
		}
		const providerMembership = await memberships.findOne({
			where: {practiceId: practice.id, userId: provider.id},
		});
		if (!providerMembership) {
			await memberships.save({
				practiceId: practice.id,
				userId: provider.id,
				role: 'PROVIDER',
			});
		}

		for (const demographics of SEEDED_PATIENTS) {
			const existing = await patients.findOne({
				where: {practiceId: practice.id, email: demographics.email},
			});
			if (existing) {
				continue;
			}
			await patients.save({
				...demographics,
				practiceId: practice.id,
				assignedProviderUserId: provider.id,
				synthetic: true,
			});
		}

		Logger.log(
			`Seeded synthetic practice admin, provider ${provider.id}, and demo patients`,
			'MockIdentity',
		);
	} finally {
		await dataSource.destroy();
	}
}

seed().catch((error: unknown) => {
	Logger.error(safeError(error), 'MockIdentity');
	process.exitCode = 1;
});
