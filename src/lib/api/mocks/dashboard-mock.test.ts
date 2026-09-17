import {filterMetricsForRole} from '@/lib/api/mocks/dashboard-mock';
import {fixtureDashboardMetrics} from '@/lib/api/mocks/fixtures';

describe('filterMetricsForRole', () => {
	it('returns no metrics without a role', () => {
		expect(filterMetricsForRole(fixtureDashboardMetrics, undefined)).toEqual([]);
	});

	it('returns staff metrics for PRACTICE_ADMIN', () => {
		const ids = filterMetricsForRole(fixtureDashboardMetrics, 'PRACTICE_ADMIN').map((metric) => metric.id);
		expect(ids).toEqual([
			'total_patients',
			'todays_appointments',
			'monthly_revenue',
			'patient_satisfaction',
		]);
	});

	it('returns patient-only metrics for PATIENT', () => {
		const ids = filterMetricsForRole(fixtureDashboardMetrics, 'PATIENT').map((metric) => metric.id);
		expect(ids).toEqual(['upcoming_visits', 'open_balance']);
	});
});
