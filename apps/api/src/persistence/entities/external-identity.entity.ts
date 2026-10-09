import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique} from 'typeorm';
import {User} from './user.entity.js';

@Entity({name: 'external_identities'})
@Unique('external_identities_provider_subject_key', ['provider', 'subject'])
@Unique('external_identities_user_id_provider_key', ['userId', 'provider'])
export class ExternalIdentity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({name: 'user_id', type: 'uuid'})
	userId!: string;

	@ManyToOne(() => User, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'user_id'})
	user!: User;

	@Column({type: 'varchar', length: 32})
	provider!: string;

	@Column({type: 'varchar', length: 255})
	subject!: string;

	@Column({name: 'email_at_link', type: 'varchar', length: 320, nullable: true})
	emailAtLink!: string | null;

	@Column({name: 'created_at', type: 'timestamptz', default: () => 'now()'})
	createdAt!: Date;

	@Column({name: 'updated_at', type: 'timestamptz', default: () => 'now()'})
	updatedAt!: Date;
}
