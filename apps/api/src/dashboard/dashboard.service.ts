import {Inject, Injectable} from '@nestjs/common';
import {InvoiceRepository} from '../billing/invoice.repository.js';
import {CLOCK, type Clock} from '../identity/clock.js';
import {AppointmentRepository} from '../scheduling/appointment.repository.js';
import {PatientRepository} from '../practice/patient.repository.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {
	filterMetricsForRole,
	formatCount,
	formatCurrency,
	LIVE_DASHBOARD_METRICS,
	type LiveDashboardMetricId,
} from './dashboard.access.js';
import type {DashboardMetricRdo, DashboardOverviewRdo} from './dashboard.rdo.js';

@Injectable()
export class DashboardService {
	constructor(
		private readonly patients: PatientRepository,
		private readonly appointments: AppointmentRepository,
		private readonly invoices: InvoiceRepository,
		private readonly tenant: TenantContext,
		@Inject(CLOCK) private readonly clock: Clock,
	) {}

	async getOverview(): Promise<DashboardOverviewRdo> {
		const {role, actorUserId} = this.tenant.require();
		const now = this.clock.now();
		const visible = filterMetricsForRole(LIVE_DASHBOARD_METRICS, role);
		const values = await this.resolveValues(
			new Set(visible.map((metric) => metric.id)),
			actorUserId,
			now,
		);
		return {
			synthetic: true,
			metrics: visible.map(
				(metric): DashboardMetricRdo => ({
					id: metric.id,
					title: metric.title,
					value: values[metric.id] ?? '0',
					icon: metric.icon,
					description: metric.description,
					roles: [...metric.roles],
				}),
			),
		};
	}

	private async resolveValues(
		needed: Set<LiveDashboardMetricId>,
		actorUserId: string,
		now: Date,
	): Promise<Partial<Record<LiveDashboardMetricId, string>>> {
		const values: Partial<Record<LiveDashboardMetricId, string>> = {};
		const tasks: Array<Promise<void>> = [];

		if (needed.has('total_patients')) {
			tasks.push(
				this.patients.countForPractice().then((count) => {
					values.total_patients = formatCount(count);
				}),
			);
		}
		if (needed.has('todays_appointments')) {
			tasks.push(
				this.appointments.countStartingOnUtcDay(now).then((count) => {
					values.todays_appointments = formatCount(count);
				}),
			);
		}
		if (needed.has('monthly_revenue')) {
			tasks.push(
				this.invoices.sumAmountCentsIssuedInUtcMonth(now).then((sum) => {
					values.monthly_revenue = formatCurrency(sum.amountCents, sum.currency);
				}),
			);
		}
		if (needed.has('upcoming_visits')) {
			tasks.push(
				this.appointments.countUpcomingForPortalUser(actorUserId, now).then((count) => {
					values.upcoming_visits = formatCount(count);
				}),
			);
		}
		if (needed.has('open_balance')) {
			tasks.push(
				this.invoices.sumOpenBalanceForPortalUser(actorUserId).then((sum) => {
					values.open_balance = formatCurrency(sum.amountCents, sum.currency);
				}),
			);
		}

		await Promise.all(tasks);
		return values;
	}
}
