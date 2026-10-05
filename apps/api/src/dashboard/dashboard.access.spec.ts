import {describe, expect, it} from 'vitest';
import {
	filterMetricsForRole,
	formatCount,
	formatCurrency,
	LIVE_DASHBOARD_METRICS,
} from './dashboard.access.js';

describe('dashboard access', () => {
	it('returns no metrics without a role', () => {
		expect(filterMetricsForRole(LIVE_DASHBOARD_METRICS, undefined)).toEqual([]);
	});

	it('returns census, today, and revenue for PRACTICE_ADMIN', () => {
		const ids = filterMetricsForRole(LIVE_DASHBOARD_METRICS, 'PRACTICE_ADMIN').map(
			(metric) => metric.id,
		);
		expect(ids).toEqual(['total_patients', 'todays_appointments', 'monthly_revenue']);
	});

	it('omits monthly revenue for NURSE and PROVIDER', () => {
		expect(filterMetricsForRole(LIVE_DASHBOARD_METRICS, 'NURSE').map((metric) => metric.id)).toEqual(
			['total_patients', 'todays_appointments'],
		);
		expect(
			filterMetricsForRole(LIVE_DASHBOARD_METRICS, 'PROVIDER').map((metric) => metric.id),
		).toEqual(['total_patients', 'todays_appointments']);
	});

	it('returns patient-only metrics for PATIENT', () => {
		const ids = filterMetricsForRole(LIVE_DASHBOARD_METRICS, 'PATIENT').map((metric) => metric.id);
		expect(ids).toEqual(['upcoming_visits', 'open_balance']);
	});

	it('omits patient_satisfaction from the live catalog', () => {
		expect(LIVE_DASHBOARD_METRICS.map((metric) => metric.id)).not.toContain('patient_satisfaction');
	});

	it('formats counts and currency for live card values', () => {
		expect(formatCount(20)).toBe('20');
		expect(formatCount(2834)).toBe('2,834');
		expect(formatCurrency(47000)).toBe('$470.00');
		expect(formatCurrency(0)).toBe('$0.00');
	});
});
