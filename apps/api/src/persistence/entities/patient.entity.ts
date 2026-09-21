import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import {Practice} from './practice.entity.js';

@Entity({name: 'patients'})
@Index('patients_practice_id_idx', ['practiceId'])
@Index('patients_practice_id_last_name_idx', ['practiceId', 'lastName'])
export class Patient {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({name: 'practice_id', type: 'uuid'})
	practiceId!: string;

	@ManyToOne(() => Practice, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'practice_id'})
	practice!: Practice;

	@Column({name: 'first_name', type: 'varchar', length: 100})
	firstName!: string;

	@Column({name: 'last_name', type: 'varchar', length: 100})
	lastName!: string;

	@Column({type: 'boolean', default: true})
	synthetic!: boolean;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;

	@UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
	updatedAt!: Date;
}
