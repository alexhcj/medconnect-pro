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
import {User} from './user.entity.js';

@Entity({name: 'notification_preferences'})
@Index('notification_preferences_practice_id_user_id_uidx', ['practiceId', 'userId'], {
	unique: true,
})
export class NotificationPreference {
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

	@Column({name: 'in_app_enabled', type: 'boolean', default: true})
	inAppEnabled!: boolean;

	@Column({name: 'email_enabled', type: 'boolean', default: true})
	emailEnabled!: boolean;

	@Column({name: 'sms_enabled', type: 'boolean', default: true})
	smsEnabled!: boolean;

	@Column({type: 'boolean', default: true})
	synthetic!: boolean;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;

	@UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
	updatedAt!: Date;
}
