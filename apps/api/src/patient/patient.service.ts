import {Inject, Injectable} from '@nestjs/common';
import {REQUEST} from '@nestjs/core';
import type {Request} from 'express';
import {AuditEventRepository} from '../audit/audit-event.repository.js';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import type {Patient} from '../persistence/entities/patient.entity.js';
import {getCorrelationId} from '../platform/correlation.js';
import {MembershipRepository} from '../practice/membership.repository.js';
import {
	PatientRepository,
	type PatientDemographics,
	type PatientPage,
	type PatientSearchQuery,
	type PatientUpdateInput,
} from '../practice/patient.repository.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {canWriteDemographics, resolvePatientReadScope} from './patient-access.js';
import {InvalidProviderAssignmentError, PatientNotFoundError} from './patient.errors.js';
import type {PatientRdo, PatientSearchResultRdo} from './patient.rdo.js';
import type {PatientCreateBody, PatientListQuery, PatientUpdateBody} from './patient.schema.js';

@Injectable()
export class PatientService {
	constructor(
		private readonly patients: PatientRepository,
		private readonly memberships: MembershipRepository,
		private readonly tenant: TenantContext,
		private readonly audit: AuditEventRepository,
		@Inject(REQUEST) private readonly request: Request,
	) {}

	async list(query: PatientListQuery): Promise<PatientSearchResultRdo> {
		const page = await this.patients.search(this.scopedQuery(query));
		return toSearchResult(page);
	}

	async get(id: string): Promise<PatientRdo> {
		const row = await this.loadVisible(id);
		await this.recordAudit('patient.accessed', row.id);
		return toPatientRdo(row);
	}

	async create(input: PatientCreateBody): Promise<PatientRdo> {
		this.assertCanWrite();
		await this.assertAssignedProvider(input.providerId);
		const row = await this.patients.create(flattenCreate(input));
		await this.recordAudit('patient.created', row.id);
		return toPatientRdo(row);
	}

	async update(id: string, input: PatientUpdateBody): Promise<PatientRdo> {
		this.assertCanWrite();
		await this.loadVisible(id);
		if (input.providerId !== undefined) {
			await this.assertAssignedProvider(input.providerId);
		}
		const row = await this.patients.update(id, flattenUpdate(input));
		if (!row) {
			throw new PatientNotFoundError();
		}
		await this.recordAudit('patient.updated', row.id);
		return toPatientRdo(row);
	}

	private scopedQuery(query: PatientListQuery): PatientSearchQuery {
		const scope = this.tenant.require();
		const read = resolvePatientReadScope(scope.role);
		if (read === 'denied') {
			throw new PermissionDeniedError();
		}
		return {
			q: query.q,
			status: query.status,
			sort: query.sort,
			page: query.page,
			assignedToUserId: read.kind === 'assigned' ? scope.actorUserId : undefined,
			portalUserId: read.kind === 'own' ? scope.actorUserId : undefined,
		};
	}

	private async loadVisible(id: string): Promise<Patient> {
		const scope = this.tenant.require();
		const read = resolvePatientReadScope(scope.role);
		if (read === 'denied') {
			throw new PermissionDeniedError();
		}
		const row = await this.patients.getById(id);
		if (!row) {
			throw new PatientNotFoundError();
		}
		if (read.kind === 'assigned' && !(await this.patients.isAssigned(id, scope.actorUserId))) {
			throw new PatientNotFoundError();
		}
		if (read.kind === 'own' && row.portalUserId !== scope.actorUserId) {
			throw new PatientNotFoundError();
		}
		return row;
	}

	private assertCanWrite(): void {
		const {role} = this.tenant.require();
		if (!canWriteDemographics(role)) {
			throw new PermissionDeniedError();
		}
	}

	private async assertAssignedProvider(providerId: string): Promise<void> {
		const memberships = await this.memberships.list();
		const match = memberships.some(
			(membership) => membership.userId === providerId && membership.role === 'PROVIDER',
		);
		if (!match) {
			throw new InvalidProviderAssignmentError();
		}
	}

	private async recordAudit(action: string, resourceId: string): Promise<void> {
		await this.audit.record({
			action,
			resourceType: 'patient',
			resourceId,
			correlationId: getCorrelationId(this.request),
		});
	}
}

function flattenCreate(input: PatientCreateBody): PatientDemographics {
	return {
		firstName: input.firstName,
		lastName: input.lastName,
		dateOfBirth: input.dateOfBirth,
		gender: input.gender,
		status: input.status,
		phone: input.phone,
		email: input.email,
		street: input.address.street,
		city: input.address.city,
		state: input.address.state,
		postalCode: input.address.postalCode,
		emergencyContactName: input.emergencyContact.name,
		emergencyContactRelationship: input.emergencyContact.relationship,
		emergencyContactPhone: input.emergencyContact.phone,
		insuranceProvider: input.insurance.provider,
		insurancePolicyNumber: input.insurance.policyNumber,
		insuranceGroupNumber: input.insurance.groupNumber,
		providerId: input.providerId,
	};
}

function flattenUpdate(input: PatientUpdateBody): PatientUpdateInput {
	const output: PatientUpdateInput = {};
	if (input.firstName !== undefined) {
		output.firstName = input.firstName;
	}
	if (input.lastName !== undefined) {
		output.lastName = input.lastName;
	}
	if (input.dateOfBirth !== undefined) {
		output.dateOfBirth = input.dateOfBirth;
	}
	if (input.gender !== undefined) {
		output.gender = input.gender;
	}
	if (input.status !== undefined) {
		output.status = input.status;
	}
	if (input.phone !== undefined) {
		output.phone = input.phone;
	}
	if (input.email !== undefined) {
		output.email = input.email;
	}
	if (input.address) {
		output.street = input.address.street;
		output.city = input.address.city;
		output.state = input.address.state;
		output.postalCode = input.address.postalCode;
	}
	if (input.emergencyContact) {
		output.emergencyContactName = input.emergencyContact.name;
		output.emergencyContactRelationship = input.emergencyContact.relationship;
		output.emergencyContactPhone = input.emergencyContact.phone;
	}
	if (input.insurance) {
		output.insuranceProvider = input.insurance.provider;
		output.insurancePolicyNumber = input.insurance.policyNumber;
		output.insuranceGroupNumber = input.insurance.groupNumber;
	}
	if (input.providerId !== undefined) {
		output.providerId = input.providerId;
	}
	return output;
}

export function toPatientRdo(row: Patient): PatientRdo {
	return {
		id: row.id,
		firstName: row.firstName,
		lastName: row.lastName,
		dateOfBirth: row.dateOfBirth,
		gender: row.gender,
		status: row.status,
		phone: row.phone,
		email: row.email,
		address: {
			street: row.street,
			city: row.city,
			state: row.state,
			postalCode: row.postalCode,
		},
		emergencyContact: {
			name: row.emergencyContactName,
			relationship: row.emergencyContactRelationship,
			phone: row.emergencyContactPhone,
		},
		insurance: {
			provider: row.insuranceProvider,
			policyNumber: row.insurancePolicyNumber,
			groupNumber: row.insuranceGroupNumber,
		},
		providerId: row.assignedProviderUserId ?? '',
		practiceId: row.practiceId,
		synthetic: row.synthetic,
	};
}

function toSearchResult(page: PatientPage): PatientSearchResultRdo {
	return {
		patients: page.patients.map((row) => toPatientRdo(row)),
		nextPage: page.nextPage,
		hasMore: page.hasMore,
	};
}
