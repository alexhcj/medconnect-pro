import {Logger} from '@nestjs/common';
import {DataSource} from 'typeorm';
import {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import {Practice} from '../persistence/entities/practice.entity.js';
import {User} from '../persistence/entities/user.entity.js';
import {DEFAULT_DATABASE_URL} from '../persistence/default-database-url.js';
import {postgresConnectionOptions} from '../persistence/typeorm.options.js';
import {defaultMockIdpAccounts} from './mock-idp.js';

const DEMO_EMAIL = 'practice.admin@example.test';
const PRACTICE_NAME = 'Harbor Synthetic Practice';

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

		let user = await users.findOne({where: {email: account.email}});
		if (!user) {
			user = await users.save({email: account.email});
		}

		const existing = await memberships.findOne({where: {userId: user.id}});
		if (existing) {
			Logger.log(`Mock identity already present for ${account.email}`, 'MockIdentity');
			return;
		}

		let practice = await practices.findOne({where: {name: PRACTICE_NAME}});
		if (!practice) {
			practice = await practices.save({name: PRACTICE_NAME});
		}
		await memberships.save({
			practiceId: practice.id,
			userId: user.id,
			role: account.role,
		});
		Logger.log(`Seeded synthetic mock identity for ${account.email}`, 'MockIdentity');
	} finally {
		await dataSource.destroy();
	}
}

seed().catch((error: unknown) => {
	Logger.error(safeError(error), 'MockIdentity');
	process.exitCode = 1;
});
