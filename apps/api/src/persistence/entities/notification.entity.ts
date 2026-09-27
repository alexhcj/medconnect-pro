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

export const NOTIFICATION_CHANNELS = ['in_app', 'email', 'sms'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_TYPES = ['generic', 'appointment_changed'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_STATUSES = ['pending', 'delivered', 'failed'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

@Entity({name: 'notifications'})
@Index('notifications_practice_id_recipient_user_id_created_at_idx', [
	'practiceId',
	'recipientUserId',
	'createdAt',
])
export class Notification {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({name: 'practice_id', type: 'uuid'})
	practiceId!: string;

	@ManyToOne(() => Practice, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'practice_id'})
	practice!: Practice;

	@Column({name: 'recipient_user_id', type: 'uuid'})
	recipientUserId!: string;

	@ManyToOne(() => User, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'recipient_user_id'})
	recipient!: User;

	@Column({type: 'varchar', length: 32})
	channel!: NotificationChannel;

	@Column({type: 'varchar', length: 32})
	type!: NotificationType;

	@Column({type: 'varchar', length: 200})
	title!: string;

	@Column({type: 'varchar', length: 1000})
	body!: string;

	@Column({type: 'varchar', length: 32})
	status!: NotificationStatus;

	@Column({name: 'attempt_count', type: 'int', default: 0})
	attemptCount!: number;

	@Column({name: 'last_attempt_at', type: 'timestamptz', nullable: true})
	lastAttemptAt!: Date | null;

	@Column({name: 'delivered_at', type: 'timestamptz', nullable: true})
	deliveredAt!: Date | null;

	@Column({name: 'read_at', type: 'timestamptz', nullable: true})
	readAt!: Date | null;

	@Column({type: 'boolean', default: true})
	synthetic!: boolean;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;

	@UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
	updatedAt!: Date;
}
