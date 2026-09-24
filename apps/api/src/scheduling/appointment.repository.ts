import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {QueryFailedError, Repository} from 'typeorm';
import {
	Appointment,
	type AppointmentState,
	type AppointmentType,
} from '../persistence/entities/appointment.entity.js';
import {PatientAssignment} from '../persistence/entities/patient-assignment.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';
import {AppointmentConflictError} from './appointment.errors.js';

export const DEFAULT_APPOINTMENT_PAGE_SIZE = 50;
export const MAX_APPOINTMENT_PAGE_SIZE = 100;

export type AppointmentWriteInput = {
	patientId: string;
	providerUserId: string;
	startAt: Date;
	endAt: Date;
	type: AppointmentType;
	state: AppointmentState;
	notes?: string | null;
	practiceId?: string;
};

export type AppointmentUpdateInput = {
	patientId?: string;
	providerUserId?: string;
	startAt?: Date;
	endAt?: Date;
	type?: AppointmentType;
	state?: AppointmentState;
	notes?: string | null;
	practiceId?: string;
};

export type AppointmentSearchQuery = {
	from?: Date;
	to?: Date;
	patientId?: string;
	providerUserId?: string;
	state?: AppointmentState;
	page?: number;
	pageSize?: number;
	assignedToUserId?: string;
	portalUserId?: string;
};

export type AppointmentPage = {
	appointments: Appointment[];
	nextPage?: number;
	hasMore: boolean;
};

export type BusyInterval = {
	appointmentId: string;
	startAt: Date;
	endAt: Date;
};

@Injectable()
export class AppointmentRepository {
	constructor(
		@InjectRepository(Appointment)
		private readonly rows: Repository<Appointment>,
		private readonly tenant: TenantContext,
	) {}

	async search(query: AppointmentSearchQuery): Promise<AppointmentPage> {
		const {practiceId} = this.tenant.require();
		const page = query.page ?? 1;
		const pageSize = clampPageSize(query.pageSize);
		const qb = this.rows
			.createQueryBuilder('appointment')
			.leftJoinAndSelect('appointment.patient', 'patient')
			.leftJoinAndSelect('appointment.provider', 'provider')
			.where('appointment.practiceId = :practiceId', {practiceId});

		if (query.assignedToUserId) {
			qb.innerJoin(
				PatientAssignment,
				'assignment',
				'assignment.patientId = appointment.patientId AND assignment.userId = :assignedToUserId AND assignment.practiceId = :practiceId',
				{assignedToUserId: query.assignedToUserId},
			);
		}
		if (query.portalUserId) {
			qb.andWhere('patient.portalUserId = :portalUserId', {portalUserId: query.portalUserId});
		}
		if (query.patientId) {
			qb.andWhere('appointment.patientId = :patientId', {patientId: query.patientId});
		}
		if (query.providerUserId) {
			qb.andWhere('appointment.providerUserId = :providerUserId', {
				providerUserId: query.providerUserId,
			});
		}
		if (query.state) {
			qb.andWhere('appointment.state = :state', {state: query.state});
		}
		if (query.from) {
			qb.andWhere('appointment.endAt > :from', {from: query.from});
		}
		if (query.to) {
			qb.andWhere('appointment.startAt < :to', {to: query.to});
		}

		qb.orderBy('appointment.startAt', 'ASC').addOrderBy('appointment.id', 'ASC');
		qb.skip((page - 1) * pageSize).take(pageSize);

		const [appointments, total] = await qb.getManyAndCount();
		const hasMore = page * pageSize < total;
		return {
			appointments,
			hasMore,
			nextPage: hasMore ? page + 1 : undefined,
		};
	}

	async getById(id: string): Promise<Appointment | undefined> {
		const {practiceId} = this.tenant.require();
		const row = await this.rows.findOne({
			where: {id, practiceId},
			relations: {patient: true, provider: true},
		});
		return row ?? undefined;
	}

	async listProviderBusy(
		providerUserId: string,
		from: Date,
		to: Date,
		excludeId?: string,
	): Promise<BusyInterval[]> {
		const {practiceId} = this.tenant.require();
		const qb = this.rows
			.createQueryBuilder('appointment')
			.where('appointment.practiceId = :practiceId', {practiceId})
			.andWhere('appointment.providerUserId = :providerUserId', {providerUserId})
			.andWhere("appointment.state <> 'cancelled'")
			.andWhere('appointment.endAt > :from', {from})
			.andWhere('appointment.startAt < :to', {to});
		if (excludeId) {
			qb.andWhere('appointment.id <> :excludeId', {excludeId});
		}
		qb.orderBy('appointment.startAt', 'ASC');
		const rows = await qb.getMany();
		return rows.map((row) => ({
			appointmentId: row.id,
			startAt: row.startAt,
			endAt: row.endAt,
		}));
	}

	async create(input: AppointmentWriteInput): Promise<Appointment> {
		const {practiceId} = this.tenant.require();
		this.rejectMismatchedPracticeId(input.practiceId, practiceId);
		const row = this.rows.create({
			practiceId,
			patientId: input.patientId,
			providerUserId: input.providerUserId,
			startAt: input.startAt,
			endAt: input.endAt,
			type: input.type,
			state: input.state,
			notes: input.notes ?? null,
			synthetic: true,
		});
		try {
			const saved = await this.rows.save(row);
			return (await this.getById(saved.id)) ?? saved;
		} catch (error) {
			throw mapWriteError(error);
		}
	}

	async update(id: string, input: AppointmentUpdateInput): Promise<Appointment | undefined> {
		const {practiceId} = this.tenant.require();
		this.rejectMismatchedPracticeId(input.practiceId, practiceId);
		const row = await this.getById(id);
		if (!row) {
			return undefined;
		}
		assignDefined(row, input);
		try {
			await this.rows.save(row);
			return this.getById(id);
		} catch (error) {
			throw mapWriteError(error);
		}
	}

	async remove(id: string): Promise<boolean> {
		const {practiceId} = this.tenant.require();
		const result = await this.rows.delete({id, practiceId});
		return (result.affected ?? 0) > 0;
	}

	private rejectMismatchedPracticeId(
		clientPracticeId: string | undefined,
		scopePracticeId: string,
	): void {
		if (clientPracticeId !== undefined && clientPracticeId !== scopePracticeId) {
			throw new TenantMismatchError();
		}
	}
}

function clampPageSize(pageSize: number | undefined): number {
	if (pageSize === undefined) {
		return DEFAULT_APPOINTMENT_PAGE_SIZE;
	}
	return Math.min(Math.max(pageSize, 1), MAX_APPOINTMENT_PAGE_SIZE);
}

function assignDefined(row: Appointment, input: AppointmentUpdateInput): void {
	if (input.patientId !== undefined) {
		row.patientId = input.patientId;
	}
	if (input.providerUserId !== undefined) {
		row.providerUserId = input.providerUserId;
	}
	if (input.startAt !== undefined) {
		row.startAt = input.startAt;
	}
	if (input.endAt !== undefined) {
		row.endAt = input.endAt;
	}
	if (input.type !== undefined) {
		row.type = input.type;
	}
	if (input.state !== undefined) {
		row.state = input.state;
	}
	if (input.notes !== undefined) {
		row.notes = input.notes;
	}
}

function mapWriteError(error: unknown): unknown {
	if (error instanceof QueryFailedError) {
		const driver = error.driverError as {code?: string};
		if (driver?.code === '23P01') {
			return new AppointmentConflictError();
		}
	}
	return error;
}
