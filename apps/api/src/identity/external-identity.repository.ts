import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {ExternalIdentity} from '../persistence/entities/external-identity.entity.js';

export type NewExternalIdentity = {
	userId: string;
	provider: string;
	subject: string;
	emailAtLink: string | null;
};

@Injectable()
export class ExternalIdentityRepository {
	constructor(
		@InjectRepository(ExternalIdentity)
		private readonly rows: Repository<ExternalIdentity>,
	) {}

	async findByProviderSubject(
		provider: string,
		subject: string,
	): Promise<ExternalIdentity | undefined> {
		const row = await this.rows.findOne({where: {provider, subject}});
		return row ?? undefined;
	}

	async findByUserProvider(userId: string, provider: string): Promise<ExternalIdentity | undefined> {
		const row = await this.rows.findOne({where: {userId, provider}});
		return row ?? undefined;
	}

	async insert(input: NewExternalIdentity): Promise<ExternalIdentity> {
		await this.rows.insert(input);
		const row = await this.rows.findOneOrFail({
			where: {provider: input.provider, subject: input.subject},
		});
		return row;
	}
}
