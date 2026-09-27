import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuditModule} from '../audit/audit.module.js';
import {CLOCK, systemClock} from '../identity/clock.js';
import {NotificationPreference} from '../persistence/entities/notification-preference.entity.js';
import {Notification} from '../persistence/entities/notification.entity.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {DemoEmailSender} from './demo-email-sender.js';
import {DemoSmsSender} from './demo-sms-sender.js';
import {DELIVERY_SLEEP, defaultDeliverySleep} from './delivery-bus.js';
import {EMAIL_SENDER} from './email-sender.js';
import {inProcessDeliveryBusProvider} from './in-process-delivery-bus.js';
import {NotificationPreferenceRepository} from './notification-preference.repository.js';
import {NotificationController} from './notification.controller.js';
import {NotificationRepository} from './notification.repository.js';
import {NotificationService} from './notification.service.js';
import {SMS_SENDER} from './sms-sender.js';

@Module({
	imports: [
		TenancyModule,
		AuditModule,
		TypeOrmModule.forFeature([Notification, NotificationPreference]),
	],
	controllers: [NotificationController],
	providers: [
		NotificationService,
		NotificationRepository,
		NotificationPreferenceRepository,
		{provide: EMAIL_SENDER, useClass: DemoEmailSender},
		{provide: SMS_SENDER, useClass: DemoSmsSender},
		{provide: CLOCK, useValue: systemClock},
		{provide: DELIVERY_SLEEP, useValue: defaultDeliverySleep},
		inProcessDeliveryBusProvider,
	],
	exports: [NotificationService],
})
export class NotificationsModule {}
