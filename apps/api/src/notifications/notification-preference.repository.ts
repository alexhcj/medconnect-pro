import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {NotificationPreference} from '../persistence/entities/notification-preference.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {rejectMismatchedPracticeId} from './notification.repository.js';

export const DEFAULT_NOTIFICATION_PREFERENCES = {
	inAppEnabled: true,
	emailEnabled: true,
	smsEnabled: true,
} as const;

export type NotificationPreferencePatch = {
	inAppEnabled?: boolean;
	emailEnabled?: boolean;
	smsEnabled?: boolean;
	practiceId?: string;
};

@Injectable()
export class NotificationPreferenceRepository {
	constructor(
		@InjectRepository(NotificationPreference)
		private readonly rows: Repository<NotificationPreference>,
		private readonly tenant: TenantContext,
	) {}

	async getForUser(userId: string): Promise<NotificationPreference | undefined> {
		const {practiceId} = this.tenant.require();
		const row = await this.rows.findOne({where: {practiceId, userId}});
		return row ?? undefined;
	}

	async upsertForUser(
		userId: string,
		patch: NotificationPreferencePatch,
	): Promise<NotificationPreference> {
		const {practiceId} = this.tenant.require();
		rejectMismatchedPracticeId(patch.practiceId, practiceId);
		const existing = await this.getForUser(userId);
		if (existing) {
			if (patch.inAppEnabled !== undefined) {
				existing.inAppEnabled = patch.inAppEnabled;
			}
			if (patch.emailEnabled !== undefined) {
				existing.emailEnabled = patch.emailEnabled;
			}
			if (patch.smsEnabled !== undefined) {
				existing.smsEnabled = patch.smsEnabled;
			}
			existing.synthetic = true;
			return this.rows.save(existing);
		}
		const row = this.rows.create({
			practiceId,
			userId,
			inAppEnabled: patch.inAppEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.inAppEnabled,
			emailEnabled: patch.emailEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.emailEnabled,
			smsEnabled: patch.smsEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.smsEnabled,
			synthetic: true,
		});
		return this.rows.save(row);
	}
}
