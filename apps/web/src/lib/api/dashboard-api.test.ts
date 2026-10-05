import {afterEach, describe, expect, it, vi} from 'vitest';
import {dashboardRealAPI} from '@/lib/api/dashboard-api';
import type {DashboardOverviewRdo} from '@/lib/api/dashboard-rdo';

const overviewRdo: DashboardOverviewRdo = {
	synthetic: true,
	metrics: [
		{
			id: 'total_patients',
			title: 'Total Patients',
			value: '20',
			icon: 'users',
			description: 'Active patients in system',
			roles: ['SUPER_ADMIN', 'PRACTICE_ADMIN', 'PROVIDER', 'NURSE', 'RECEPTIONIST'],
		},
		{
			id: 'todays_appointments',
			title: "Today's Appointments",
			value: '2',
			icon: 'calendar',
			description: 'Scheduled for today',
			roles: ['SUPER_ADMIN', 'PRACTICE_ADMIN', 'PROVIDER', 'NURSE', 'RECEPTIONIST'],
		},
		{
			id: 'monthly_revenue',
			title: 'Monthly Revenue',
			value: '$470.00',
			icon: 'revenue',
			description: "This month's earnings",
			roles: ['SUPER_ADMIN', 'PRACTICE_ADMIN', 'RECEPTIONIST'],
		},
	],
};

function jsonResponse(body: unknown, status = 200) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	};
}

function authorizationFromCall(call: unknown[] | undefined) {
	const init = call?.[1] as RequestInit | undefined;
	return new Headers(init?.headers).get('Authorization');
}

describe('dashboardRealAPI', () => {
	afterEach(() => {
		localStorage.removeItem('auth_token');
		vi.unstubAllGlobals();
	});

	it('loads Nest overview with Bearer and unwraps DashboardOverviewRdo', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(overviewRdo));
		vi.stubGlobal('fetch', fetchMock);

		const overview = await dashboardRealAPI.getOverview();

		expect(overview.metrics.map((metric) => metric.id)).toEqual([
			'total_patients',
			'todays_appointments',
			'monthly_revenue',
		]);
		expect(overview.metrics.find((metric) => metric.id === 'patient_satisfaction')).toBeUndefined();
		expect(overview.metrics.every((metric) => metric.trend === undefined)).toBe(true);
		expect(overview).not.toHaveProperty('synthetic');
		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:3001/dashboard/overview',
			expect.any(Object),
		);
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('practiceId');
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('/api/dashboard/overview');
		expect(authorizationFromCall(fetchMock.mock.calls[0])).toBe('Bearer demo-access-token');
	});

	it('maps a live payload that omits satisfaction without throwing', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(overviewRdo)));

		await expect(dashboardRealAPI.getOverview()).resolves.toMatchObject({
			metrics: [
				expect.objectContaining({id: 'total_patients', value: '20', icon: 'users'}),
				expect.objectContaining({id: 'todays_appointments', value: '2', icon: 'calendar'}),
				expect.objectContaining({id: 'monthly_revenue', value: '$470.00', icon: 'revenue'}),
			],
		});
	});
});
