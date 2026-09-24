import {Inject, Injectable} from '@nestjs/common';
import {REQUEST} from '@nestjs/core';
import type {Request} from 'express';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import type {Appointment} from '../persistence/entities/appointment.entity.js';
import {getCorrelationId} from '../platform/correlation.js';
import {MembershipRepository} from '../practice/membership.repository.js';
import {PatientRepository} from '../practice/patient.repository.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {canWriteAppointments, resolveAppointmentReadScope} from './appointment-access.js';
import {
	AppointmentConflictError,
	AppointmentNotFoundError,
	InvalidAppointmentPatientError,
	InvalidAppointmentProviderError,
	InvalidAppointmentTimeError,
} from './appointment.errors.js';
import type {
	AppointmentRdo,
	AppointmentSearchResultRdo,
	ProviderAvailabilityRdo,
} from './appointment.rdo.js';
import type {
	AppointmentCreateBody,
	AppointmentListQuery,
	AppointmentUpdateBody,
	AvailabilityQuery,
} from './appointment.schema.js';
import {
	AppointmentRepository,
	type AppointmentPage,
	type AppointmentSearchQuery,
	type AppointmentUpdateInput,
	type BusyInterval,
} from './appointment.repository.js';
import {AuditEventRepository} from './audit-event.repository.js';
import {
	DEMO_AVAILABILITY_TIME_ZONE,
	DEMO_WORKING_HOURS,
	subtractBusy,
	workingIntervals,
} from './availability.js';

const AUDIT_RESOURCE = 'appointment';

@Injectable()
export class AppointmentService {
	constructor(
		private readonly appointments: AppointmentRepository,
		private readonly patients: PatientRepository,
		private readonly memberships: MembershipRepository,
		private readonly audit: AuditEventRepository,
		private readonly tenant: TenantContext,
		@Inject(REQUEST) private readonly request: Request,
	) {}

	async list(query: AppointmentListQuery): Promise<AppointmentSearchResultRdo> {
		const page = await this.appointments.search(this.scopedQuery(query));
		return toSearchResult(page);
	}

	async get(id: string): Promise<AppointmentRdo> {
		const row = await this.loadVisible(id);
		return toAppointmentRdo(row);
	}

	async create(input: AppointmentCreateBody): Promise<AppointmentRdo> {
		this.assertCanWrite();
		await this.assertPatient(input.patientId);
		await this.assertProvider(input.providerId);
		await this.assertNoConflict(input.providerId, new Date(input.start), new Date(input.end));
		const row = await this.appointments.create({
			patientId: input.patientId,
			providerUserId: input.providerId,
			startAt: new Date(input.start),
			endAt: new Date(input.end),
			type: input.type,
			state: input.state,
			notes: input.notes ?? null,
		});
		await this.recordAudit('appointment.created', row.id);
		return toAppointmentRdo(row);
	}

	async update(id: string, input: AppointmentUpdateBody): Promise<AppointmentRdo> {
		this.assertCanWrite();
		const existing = await this.loadVisible(id);
		const nextPatientId = input.patientId ?? existing.patientId;
		const nextProviderId = input.providerId ?? existing.providerUserId;
		const nextStart = input.start ? new Date(input.start) : existing.startAt;
		const nextEnd = input.end ? new Date(input.end) : existing.endAt;
		const nextState = input.state ?? existing.state;
		if (nextEnd <= nextStart) {
			throw new InvalidAppointmentTimeError();
		}
		if (input.patientId !== undefined) {
			await this.assertPatient(nextPatientId);
		}
		if (input.providerId !== undefined) {
			await this.assertProvider(nextProviderId);
		}
		if (nextState !== 'cancelled') {
			await this.assertNoConflict(nextProviderId, nextStart, nextEnd, id);
		}
		const row = await this.appointments.update(id, flattenUpdate(input));
		if (!row) {
			throw new AppointmentNotFoundError();
		}
		await this.recordAudit('appointment.updated', row.id);
		return toAppointmentRdo(row);
	}

	async remove(id: string): Promise<void> {
		this.assertCanWrite();
		await this.loadVisible(id);
		const deleted = await this.appointments.remove(id);
		if (!deleted) {
			throw new AppointmentNotFoundError();
		}
		await this.recordAudit('appointment.deleted', id);
	}

	async availability(providerId: string, query: AvailabilityQuery): Promise<ProviderAvailabilityRdo> {
		this.assertCanRead();
		await this.assertProviderPresent(providerId);
		const from = new Date(query.from);
		const to = new Date(query.to);
		const busy = await this.appointments.listProviderBusy(providerId, from, to);
		const working = workingIntervals(from, to);
		const free = subtractBusy(
			working,
			busy.map((item) => ({start: item.startAt, end: item.endAt})),
		);
		const {practiceId} = this.tenant.require();
		return {
			providerId,
			practiceId,
			from: from.toISOString(),
			to: to.toISOString(),
			timeZone: DEMO_AVAILABILITY_TIME_ZONE,
			workingHours: [...DEMO_WORKING_HOURS],
			busy: busy.map(toBusyRdo),
			free: free.map((interval) => ({
				start: interval.start.toISOString(),
				end: interval.end.toISOString(),
			})),
		};
	}

	private scopedQuery(query: AppointmentListQuery): AppointmentSearchQuery {
		const scope = this.tenant.require();
		const read = resolveAppointmentReadScope(scope.role);
		if (read === 'denied') {
			throw new PermissionDeniedError();
		}
		return {
			from: query.from ? new Date(query.from) : undefined,
			to: query.to ? new Date(query.to) : undefined,
			patientId: query.patientId,
			providerUserId: query.providerId,
			state: query.state,
			page: query.page,
			pageSize: query.pageSize,
			assignedToUserId: read.kind === 'assigned' ? scope.actorUserId : undefined,
			portalUserId: read.kind === 'own' ? scope.actorUserId : undefined,
		};
	}

	private async loadVisible(id: string): Promise<Appointment> {
		const scope = this.tenant.require();
		const read = resolveAppointmentReadScope(scope.role);
		if (read === 'denied') {
			throw new PermissionDeniedError();
		}
		const row = await this.appointments.getById(id);
		if (!row) {
			throw new AppointmentNotFoundError();
		}
		if (read.kind === 'assigned' && !(await this.patients.isAssigned(row.patientId, scope.actorUserId))) {
			throw new AppointmentNotFoundError();
		}
		if (read.kind === 'own') {
			const patient = await this.patients.getById(row.patientId);
			if (!patient || patient.portalUserId !== scope.actorUserId) {
				throw new AppointmentNotFoundError();
			}
		}
		return row;
	}

	private assertCanWrite(): void {
		const {role} = this.tenant.require();
		if (!canWriteAppointments(role)) {
			throw new PermissionDeniedError();
		}
	}

	private assertCanRead(): void {
		const {role} = this.tenant.require();
		if (resolveAppointmentReadScope(role) === 'denied') {
			throw new PermissionDeniedError();
		}
	}

	private async assertPatient(patientId: string): Promise<void> {
		const row = await this.patients.getById(patientId);
		if (!row) {
			throw new InvalidAppointmentPatientError();
		}
	}

	private async assertProvider(providerId: string): Promise<void> {
		const memberships = await this.memberships.list();
		const match = memberships.some(
			(membership) => membership.userId === providerId && membership.role === 'PROVIDER',
		);
		if (!match) {
			throw new InvalidAppointmentProviderError();
		}
	}

	private async assertProviderPresent(providerId: string): Promise<void> {
		try {
			await this.assertProvider(providerId);
		} catch (error) {
			if (error instanceof InvalidAppointmentProviderError) {
				throw new AppointmentNotFoundError();
			}
			throw error;
		}
	}

	private async assertNoConflict(
		providerId: string,
		start: Date,
		end: Date,
		excludeId?: string,
	): Promise<void> {
		const busy = await this.appointments.listProviderBusy(providerId, start, end, excludeId);
		if (busy.length > 0) {
			throw new AppointmentConflictError();
		}
	}

	private async recordAudit(action: string, resourceId: string): Promise<void> {
		await this.audit.record({
			action,
			resourceType: AUDIT_RESOURCE,
			resourceId,
			correlationId: getCorrelationId(this.request),
		});
	}
}

function flattenUpdate(input: AppointmentUpdateBody): AppointmentUpdateInput {
	const output: AppointmentUpdateInput = {};
	if (input.patientId !== undefined) {
		output.patientId = input.patientId;
	}
	if (input.providerId !== undefined) {
		output.providerUserId = input.providerId;
	}
	if (input.start !== undefined) {
		output.startAt = new Date(input.start);
	}
	if (input.end !== undefined) {
		output.endAt = new Date(input.end);
	}
	if (input.type !== undefined) {
		output.type = input.type;
	}
	if (input.state !== undefined) {
		output.state = input.state;
	}
	if (input.notes !== undefined) {
		output.notes = input.notes;
	}
	return output;
}

export function toAppointmentRdo(row: Appointment): AppointmentRdo {
	const rdo: AppointmentRdo = {
		id: row.id,
		practiceId: row.practiceId,
		patientId: row.patientId,
		providerId: row.providerUserId,
		start: row.startAt.toISOString(),
		end: row.endAt.toISOString(),
		type: row.type,
		state: row.state,
		patientName: row.patient
			? `${row.patient.firstName} ${row.patient.lastName}`
			: row.patientId,
		providerName: row.provider?.email ?? row.providerUserId,
		synthetic: row.synthetic,
	};
	if (row.notes) {
		rdo.notes = row.notes;
	}
	return rdo;
}

function toSearchResult(page: AppointmentPage): AppointmentSearchResultRdo {
	return {
		appointments: page.appointments.map((row) => toAppointmentRdo(row)),
		nextPage: page.nextPage,
		hasMore: page.hasMore,
	};
}

function toBusyRdo(item: BusyInterval) {
	return {
		appointmentId: item.appointmentId,
		start: item.startAt.toISOString(),
		end: item.endAt.toISOString(),
	};
}
