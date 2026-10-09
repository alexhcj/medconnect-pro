import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {LessThan, Repository} from 'typeorm';
import {OAuthFlowState} from '../persistence/entities/oauth-flow-state.entity.js';

export type NewOAuthFlowState = {
	provider: string;
	stateHash: string;
	codeVerifier: string;
	nonce: string;
	returnTo: string;
	expiresAt: Date;
};

@Injectable()
export class OAuthFlowStateRepository {
	constructor(
		@InjectRepository(OAuthFlowState)
		private readonly rows: Repository<OAuthFlowState>,
	) {}

	async create(input: NewOAuthFlowState, now: Date): Promise<OAuthFlowState> {
		await this.rows.delete({expiresAt: LessThan(now)});
		await this.rows.insert(input);
		return this.rows.findOneOrFail({where: {stateHash: input.stateHash}});
	}

	/** One-time: a consumed or expired state yields `undefined`. */
	async consume(stateHash: string, now: Date): Promise<OAuthFlowState | undefined> {
		const result = await this.rows
			.createQueryBuilder()
			.update(OAuthFlowState)
			.set({consumedAt: now})
			.where('state_hash = :stateHash', {stateHash})
			.andWhere('consumed_at IS NULL')
			.andWhere('expires_at > :now', {now})
			.returning(['id'])
			.execute();
		const raw = result.raw as Array<{id: string}>;
		if (raw.length === 0) {
			return undefined;
		}
		const row = await this.rows.findOne({where: {id: raw[0].id}});
		return row ?? undefined;
	}
}
