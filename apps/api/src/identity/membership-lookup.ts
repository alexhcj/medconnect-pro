import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import {User} from '../persistence/entities/user.entity.js';

/**
 * Loads identity rows by user id. Tenant context is derived from these memberships,
 * so this lookup must not call TenantContext.require().
 */
@Injectable()
export class IdentityMembershipLookup {
	constructor(
		@InjectRepository(User)
		private readonly users: Repository<User>,
		@InjectRepository(PracticeMembership)
		private readonly memberships: Repository<PracticeMembership>,
	) {}

	async findUserByEmail(email: string): Promise<User | undefined> {
		const row = await this.users.findOne({
			where: {email: email.trim().toLowerCase()},
		});
		return row ?? undefined;
	}

	async findUserById(id: string): Promise<User | undefined> {
		const row = await this.users.findOne({where: {id}});
		return row ?? undefined;
	}

	async listForUser(userId: string): Promise<PracticeMembership[]> {
		return this.memberships.find({
			where: {userId},
			order: {createdAt: 'ASC'},
		});
	}

	async getById(id: string): Promise<PracticeMembership | undefined> {
		const row = await this.memberships.findOne({where: {id}});
		return row ?? undefined;
	}
}
