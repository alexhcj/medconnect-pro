import {Controller, Get} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {DashboardOverviewRdo} from './dashboard.rdo.js';
import {DashboardService} from './dashboard.service.js';

@ApiTags('dashboard')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboard: DashboardService) {}

	@Get('overview')
	@ApiOperation({
		summary: 'Read role-filtered dashboard overview metrics for the session tenant',
		description:
			'Any authenticated member of the resolved tenant may read this overview. Which cards appear follows session role. Counts and currency strings come from the current practice. Tenant comes from the session, not from the client. synthetic is always true. patient_satisfaction is omitted. Metric labels do not include patient names.',
	})
	@ApiOkResponse({type: DashboardOverviewRdo})
	getOverview(): Promise<DashboardOverviewRdo> {
		return this.dashboard.getOverview();
	}
}
