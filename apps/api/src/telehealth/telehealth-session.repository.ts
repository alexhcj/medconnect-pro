import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {QueryFailedError, Repository} from 'typeorm';
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
		return row ?? undefined;
	}

	async getByAppointmentId(appointmentId: string): Promise<TelehealthSession | undefined> {
		const {practiceId} = this.tenant.require();
		const row = await this.rows.findOne({
			where: {appointmentId, practiceId},
			relations: APPOINTMENT_RELATIONS,
		});
		return row ?? undefined;
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
