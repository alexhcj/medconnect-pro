import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {QueryFailedError, Repository} from 'typeorm';
import {PatientAssignment} from '../persistence/entities/patient-assignment.entity.js';
import {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import {
	TelehealthSession,
	type TelehealthSessionState,
} from '../persistence/entities/telehealth-session.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';

export type TelehealthSessionWriteInput = {
	appointmentId: string;
	state: TelehealthSessionState;
	waitingStartedAt: Date;
	joinedAt?: Date | null;
	endedAt?: Date | null;
	practiceId?: string;
};

const APPOINTMENT_RELATIONS = {
	appointment: {
		patient: true,
		provider: true,
	},
} as const;

@Injectable()
export class TelehealthSessionRepository {
	constructor(
		@InjectRepository(TelehealthSession)
		private readonly rows: Repository<TelehealthSession>,
		private readonly tenant: TenantContext,
	) {}

	async getById(id: string): Promise<TelehealthSession | undefined> {
		const {practiceId} = this.tenant.require();
		const row = await this.rows.findOne({
			where: {id, practiceId},
			relations: APPOINTMENT_RELATIONS,
		});
		return this.withProviderMembership(row);
	}

	async getByAppointmentId(appointmentId: string): Promise<TelehealthSession | undefined> {
		const {practiceId} = this.tenant.require();
		const row = await this.rows.findOne({
			where: {appointmentId, practiceId},
			relations: APPOINTMENT_RELATIONS,
		});
		return this.withProviderMembership(row);
	}

	/** Nurse memberships assigned to the patient in the session practice (call participants). */
	async listAssignedNurses(patientId: string): Promise<PracticeMembership[]> {
		const {practiceId} = this.tenant.require();
		return this.rows.manager
			.createQueryBuilder(PracticeMembership, 'membership')
			.innerJoin(
				PatientAssignment,
				'assignment',
				'assignment.userId = membership.userId AND assignment.practiceId = membership.practiceId',
			)
			.where('membership.practiceId = :practiceId', {practiceId})
			.andWhere('membership.role = :role', {role: 'NURSE'})
			.andWhere('assignment.patientId = :patientId', {patientId})
			.getMany();
	}

	/** Attach the provider's membership in the session practice so RDOs can show a display name. */
	private async withProviderMembership(
		row: TelehealthSession | null,
	): Promise<TelehealthSession | undefined> {
		if (!row) {
			return undefined;
		}
		if (row.appointment) {
			row.appointment.providerMembership = await this.rows.manager.findOne(PracticeMembership, {
				where: {userId: row.appointment.providerUserId, practiceId: row.practiceId},
			});
		}
		return row;
	}

	async create(input: TelehealthSessionWriteInput): Promise<TelehealthSession> {
		const {practiceId} = this.tenant.require();
		rejectMismatchedPracticeId(input.practiceId, practiceId);
		const row = this.rows.create({
			practiceId,
			appointmentId: input.appointmentId,
			state: input.state,
			waitingStartedAt: input.waitingStartedAt,
			joinedAt: input.joinedAt ?? null,
			endedAt: input.endedAt ?? null,
			synthetic: true,
		});
		try {
			const saved = await this.rows.save(row);
			return (await this.getById(saved.id)) ?? saved;
		} catch (error) {
			throw mapWriteError(error);
		}
	}

	async save(row: TelehealthSession): Promise<TelehealthSession> {
		await this.rows.save(row);
		return (await this.getById(row.id)) ?? row;
	}

	async transitionWaitingToInSession(id: string, joinedAt: Date): Promise<TelehealthSession | undefined> {
		const {practiceId} = this.tenant.require();
		const result = await this.rows.update({id, practiceId, state: 'waiting'}, {state: 'in_session', joinedAt});
		if (!result.affected) {
			return undefined;
		}
		return this.getById(id);
	}
}

export class TelehealthSessionUniqueConstraintError extends Error {
	constructor() {
		super('A telehealth session already exists for this appointment');
		this.name = 'TelehealthSessionUniqueConstraintError';
	}
}

function rejectMismatchedPracticeId(
	clientPracticeId: string | undefined,
	scopePracticeId: string,
): void {
	if (clientPracticeId !== undefined && clientPracticeId !== scopePracticeId) {
		throw new TenantMismatchError();
	}
}

function mapWriteError(error: unknown): unknown {
	if (error instanceof QueryFailedError) {
		const driver = error.driverError as {code?: string};
		if (driver?.code === '23505') {
			return new TelehealthSessionUniqueConstraintError();
		}
	}
	return error;
}
