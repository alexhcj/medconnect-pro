import {Inject, Injectable} from '@nestjs/common';
import {REQUEST} from '@nestjs/core';
import type {Request} from 'express';
import {AuditEventRepository} from '../audit/audit-event.repository.js';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import {type PatientNameSource, resolveDisplayName} from '../identity/display-name.js';
import type {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import {getCorrelationId} from '../platform/correlation.js';
import {resolvePageRequest, toPageMeta} from '../platform/pagination.js';
import type {PracticeRole} from '../tenancy/practice-role.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {MembershipRepository} from './membership.repository.js';
import {PracticeUserNotFoundError} from './practice-user.errors.js';
import type {PracticeUserListRdo, PracticeUserRdo} from './practice-user.rdo.js';
import type {PracticeUserListQuery} from './practice-user.schema.js';

@Injectable()
export class PracticeUserService {
	constructor(
		private readonly memberships: MembershipRepository,
		private readonly tenant: TenantContext,
		private readonly audit: AuditEventRepository,
		@Inject(REQUEST) private readonly request: Request,
	) {}

	async list(query: PracticeUserListQuery = {}): Promise<PracticeUserListRdo> {
		const paging = resolvePageRequest(query);
		const {rows, total} = await this.memberships.listWithUsers({
			...paging,
			q: query.q,
			role: query.role,
		});
		const patientNames = await this.memberships.patientNamesByPortalUserId(
			rows.filter((row) => row.role === 'PATIENT').map((row) => row.userId),
		);
		return {
			users: rows.map((row) => toPracticeUserRdo(row, patientNames.get(row.userId))),
			...toPageMeta(total, paging),
		};
	}

	async assignRole(userId: string, role: PracticeRole): Promise<PracticeUserRdo> {
		const row = await this.memberships.findWithUserByUserId(userId);
		if (!row) {
			throw new PracticeUserNotFoundError();
		}

		const {role: actorRole} = this.tenant.require();
		if (actorRole === 'PRACTICE_ADMIN' && role === 'SUPER_ADMIN') {
			throw new PermissionDeniedError();
		}
		if (row.role === 'PRACTICE_ADMIN' && role !== 'PRACTICE_ADMIN') {
			const adminCount = await this.memberships.countByRole('PRACTICE_ADMIN');
			if (adminCount === 1) {
				throw new PermissionDeniedError();
			}
		}
		if (row.role === role) {
			return this.toRdoWithPatientName(row);
		}

		const saved = await this.memberships.updateRole(row, role);
		await this.audit.record({
			action: 'membership.role_changed',
			resourceType: 'user',
			resourceId: userId,
			correlationId: getCorrelationId(this.request),
		});
		return this.toRdoWithPatientName(saved);
	}

	private async toRdoWithPatientName(row: PracticeMembership): Promise<PracticeUserRdo> {
		const names =
			row.role === 'PATIENT'
				? await this.memberships.patientNamesByPortalUserId([row.userId])
				: new Map<string, PatientNameSource>();
		return toPracticeUserRdo(row, names.get(row.userId));
	}
}

function toPracticeUserRdo(row: PracticeMembership, patient?: PatientNameSource): PracticeUserRdo {
	return {
		id: row.userId,
		email: row.user.email,
		role: row.role,
		displayName: resolveDisplayName(row, patient),
		credential: row.credential,
		personaKey: row.personaKey,
		practiceId: row.practiceId,
		synthetic: true,
	};
}
