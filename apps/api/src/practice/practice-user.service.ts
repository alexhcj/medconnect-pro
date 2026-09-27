import {Injectable} from '@nestjs/common';
import type {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import {MembershipRepository} from './membership.repository.js';
import type {PracticeUserListRdo, PracticeUserRdo} from './practice-user.rdo.js';

@Injectable()
export class PracticeUserService {
	constructor(private readonly memberships: MembershipRepository) {}

	async list(): Promise<PracticeUserListRdo> {
		const rows = await this.memberships.listWithUsers();
		return {users: rows.map(toPracticeUserRdo)};
	}
}

function toPracticeUserRdo(row: PracticeMembership): PracticeUserRdo {
	return {
		id: row.userId,
		email: row.user.email,
		role: row.role,
		practiceId: row.practiceId,
		synthetic: true,
	};
}
