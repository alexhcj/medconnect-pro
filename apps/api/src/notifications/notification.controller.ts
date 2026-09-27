import {Body, Controller, Get, Param, Patch} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {
	NotificationListRdo,
	NotificationPreferenceRdo,
	NotificationPreferenceUpdateRequestRdo,
	NotificationRdo,
} from './notification.rdo.js';
import {
	notificationIdParamsSchema,
	preferenceUpdateSchema,
	type NotificationIdParams,
	type PreferenceUpdateBody,
} from './notification.schema.js';
import {NotificationService} from './notification.service.js';

@ApiTags('notifications')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('notifications')
export class NotificationController {
	constructor(private readonly notifications: NotificationService) {}

	@Get()
	@ApiOperation({
		summary: 'List in-app notifications for the current user',
		description:
			'Inbox is self-scope only. Email and SMS ledger rows are not returned. Tenant comes from the session. synthetic is always true.',
	})
	@ApiOkResponse({type: NotificationListRdo})
	list(): Promise<NotificationListRdo> {
		return this.notifications.listOwn();
	}

	@Get('preferences')
	@ApiOperation({
		summary: 'Read notification channel preferences',
		description:
			'Missing rows return all channels enabled. Preferences are always the session user’s. Tenant comes from the session.',
	})
	@ApiOkResponse({type: NotificationPreferenceRdo})
	getPreferences(): Promise<NotificationPreferenceRdo> {
		return this.notifications.getPreferences();
	}

	@Patch('preferences')
	@ApiOperation({
		summary: 'Update notification channel preferences',
		description:
			'Updates the session user’s channel flags. Client practiceId is ignored for authorization and rejected on mismatch. Disabled channels are not dispatched.',
	})
	@ApiBody({type: NotificationPreferenceUpdateRequestRdo})
	@ApiOkResponse({type: NotificationPreferenceRdo})
	updatePreferences(
		@Body({schema: preferenceUpdateSchema}) body: PreferenceUpdateBody,
	): Promise<NotificationPreferenceRdo> {
		return this.notifications.updatePreferences(body);
	}

	@Patch(':id/read')
	@ApiOperation({
		summary: 'Mark an in-app notification as read',
		description:
			'Unknown ids, cross-tenant ids, other users’ rows, and non-inbox channels return the same not-found response.',
	})
	@ApiOkResponse({type: NotificationRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	markRead(
		@Param({schema: notificationIdParamsSchema}) params: NotificationIdParams,
	): Promise<NotificationRdo> {
		return this.notifications.markRead(params.id);
	}
}
