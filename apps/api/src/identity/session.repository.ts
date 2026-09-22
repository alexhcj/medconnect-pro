import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {IsNull, Repository} from 'typeorm';
import {AuthSession} from '../persistence/entities/auth-session.entity.js';

export type NewAuthSession = {
	userId: string;
	membershipId: string;
	accessTokenHash: string | null;
	refreshTokenHash: string | null;
	previousRefreshTokenHash: string | null;
	mfaTokenHash: string | null;
	mfaExpiresAt: Date | null;
	createdAt: Date;
	lastActivityAt: Date;
	absoluteExpiresAt: Date;
	accessExpiresAt: Date | null;
};

@Injectable()
export class SessionRepository {
	constructor(
		@InjectRepository(AuthSession)
		private readonly rows: Repository<AuthSession>,
	) {}

	async insert(input: NewAuthSession): Promise<AuthSession> {
		const row = this.rows.create(input);
		return this.rows.save(row);
	}

	async save(row: AuthSession): Promise<AuthSession> {
		return this.rows.save(row);
	}

	async findByAccessHash(hash: string): Promise<AuthSession | undefined> {
		const row = await this.rows.findOne({
			where: {accessTokenHash: hash, revokedAt: IsNull()},
		});
		return row ?? undefined;
	}

	async findByRefreshHash(hash: string): Promise<AuthSession | undefined> {
		const row = await this.rows.findOne({
			where: {refreshTokenHash: hash, revokedAt: IsNull()},
		});
		return row ?? undefined;
	}

	async findByPreviousRefreshHash(hash: string): Promise<AuthSession | undefined> {
		const row = await this.rows.findOne({
			where: {previousRefreshTokenHash: hash},
		});
		return row ?? undefined;
	}

	async findByMfaHash(hash: string): Promise<AuthSession | undefined> {
		const row = await this.rows.findOne({
			where: {mfaTokenHash: hash, revokedAt: IsNull()},
		});
		return row ?? undefined;
	}

	async revoke(id: string, now: Date): Promise<void> {
		await this.rows.update({id}, {revokedAt: now});
	}

	async revokeAllForUser(userId: string, now: Date): Promise<void> {
		await this.rows.update({userId, revokedAt: IsNull()}, {revokedAt: now});
	}
}
