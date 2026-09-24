import {Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Practice} from './practice.entity.js';
import {User} from './user.entity.js';

@Entity({name: 'audit_events'})
@Index('audit_events_practice_id_created_at_idx', ['practiceId', 'createdAt'])
export class AuditEvent {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({name: 'practice_id', type: 'uuid'})
	practiceId!: string;

	@ManyToOne(() => Practice, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'practice_id'})
	practice!: Practice;

	@Column({name: 'actor_user_id', type: 'uuid'})
	actorUserId!: string;

	@ManyToOne(() => User, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'actor_user_id'})
	actor!: User;

	@Column({type: 'varchar', length: 80})
	action!: string;

	@Column({name: 'resource_type', type: 'varchar', length: 80})
	resourceType!: string;

	@Column({name: 'resource_id', type: 'uuid', nullable: true})
	resourceId!: string | null;

	@Column({name: 'correlation_id', type: 'varchar', length: 128})
	correlationId!: string;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;
}
