import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {PRACTICE_ROLES, type PracticeRole} from '../tenancy/practice-role.js';
import {DASHBOARD_METRIC_ICONS, type DashboardMetricIcon} from './dashboard.access.js';

@ApiSchema({name: 'DashboardMetric'})
export class DashboardMetricRdo {
	@ApiProperty({example: 'total_patients'})
	id!: string;

	@ApiProperty({example: 'Total Patients'})
	title!: string;

	@ApiProperty({example: '20'})
	value!: string;

	@ApiProperty({enum: DASHBOARD_METRIC_ICONS, example: 'users'})
	icon!: DashboardMetricIcon;

	@ApiProperty({required: false, example: 'Active patients in system'})
	description?: string;

	@ApiProperty({enum: PRACTICE_ROLES, isArray: true, example: ['PRACTICE_ADMIN']})
	roles!: PracticeRole[];
}

@ApiSchema({name: 'DashboardOverview'})
export class DashboardOverviewRdo {
	@ApiProperty({
		example: true,
		description: 'Always true. This API stores synthetic demo data only.',
	})
	synthetic!: boolean;

	@ApiProperty({type: [DashboardMetricRdo]})
	metrics!: DashboardMetricRdo[];
}
