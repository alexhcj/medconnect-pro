import {Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {PracticeMembership} from './practice-membership.entity.js';
import {User} from './user.entity.js';

@Entity({name: 'auth_sessions'})
@Index('auth_sessions_user_id_idx', ['userId'])
@Index('auth_sessions_previous_refresh_token_hash_idx', ['previousRefreshTokenHash'])
export class AuthSession {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({name: 'user_id', type: 'uuid'})
	userId!: string;

	@ManyToOne(() => User, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'user_id'})
	user!: User;

	@Column({name: 'membership_id', type: 'uuid'})
	membershipId!: string;

	@ManyToOne(() => PracticeMembership, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'membership_id'})
	membership!: PracticeMembership;

	@Column({name: 'access_token_hash', type: 'varchar', length: 64, nullable: true})
	accessTokenHash!: string | null;

	@Column({name: 'refresh_token_hash', type: 'varchar', length: 64, nullable: true})
	refreshTokenHash!: string | null;

	@Column({name: 'previous_refresh_token_hash', type: 'varchar', length: 64, nullable: true})
	previousRefreshTokenHash!: string | null;

	@Column({name: 'mfa_token_hash', type: 'varchar', length: 64, nullable: true})
	mfaTokenHash!: string | null;

	@Column({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;

	@Column({name: 'last_activity_at', type: 'timestamptz'})
	lastActivityAt!: Date;

	@Column({name: 'absolute_expires_at', type: 'timestamptz'})
	absoluteExpiresAt!: Date;

	@Column({name: 'access_expires_at', type: 'timestamptz', nullable: true})
	accessExpiresAt!: Date | null;

	@Column({name: 'mfa_expires_at', type: 'timestamptz', nullable: true})
	mfaExpiresAt!: Date | null;

	@Column({name: 'revoked_at', type: 'timestamptz', nullable: true})
	revokedAt!: Date | null;
}
