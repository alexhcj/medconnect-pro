import {Module} from '@nestjs/common';
import {BillingModule} from '../billing/billing.module.js';
import {CLOCK, systemClock} from '../identity/clock.js';
import {PracticeModule} from '../practice/practice.module.js';
import {SchedulingModule} from '../scheduling/scheduling.module.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {DashboardController} from './dashboard.controller.js';
import {DashboardService} from './dashboard.service.js';

@Module({
	imports: [TenancyModule, PracticeModule, SchedulingModule, BillingModule],
	controllers: [DashboardController],
	providers: [DashboardService, {provide: CLOCK, useValue: systemClock}],
})
export class DashboardModule {}
