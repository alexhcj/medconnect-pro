import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	Unique,
	UpdateDateColumn,
} from 'typeorm';
import type {DemoPersonaKey} from '../../tenancy/persona-key.js';
import type {PracticeRole} from '../../tenancy/practice-role.js';
import {Practice} from './practice.entity.js';
import {User} from './user.entity.js';

@Entity({name: 'practice_memberships'})
@Unique('practice_memberships_practice_id_user_id_key', ['practiceId', 'userId'])
@Index('practice_memberships_practice_id_idx', ['practiceId'])
export class PracticeMembership {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({name: 'practice_id', type: 'uuid'})
	practiceId!: string;

	@ManyToOne(() => Practice, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'practice_id'})
	practice!: Practice;

	@Column({name: 'user_id', type: 'uuid'})
	userId!: string;

	@ManyToOne(() => User, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'user_id'})
	user!: User;

	@Column({type: 'varchar', length: 32})
	role!: PracticeRole;

	@Column({name: 'display_name', type: 'varchar', length: 120, nullable: true})
	displayName!: string | null;

	@Column({type: 'varchar', length: 16, nullable: true})
	credential!: string | null;

	@Column({name: 'persona_key', type: 'varchar', length: 40, nullable: true})
	personaKey!: DemoPersonaKey | null;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;

	@UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
	updatedAt!: Date;
}
