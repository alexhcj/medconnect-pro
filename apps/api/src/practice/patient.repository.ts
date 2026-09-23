import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {PatientAssignment} from '../persistence/entities/patient-assignment.entity.js';
import {
	Patient,
	type PatientGender,
	type PatientStatus,
} from '../persistence/entities/patient.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';

export const PATIENT_PAGE_SIZE = 10;

export type PatientDemographics = {
	firstName: string;
	lastName: string;
	dateOfBirth: string;
	gender: PatientGender;
	status: PatientStatus;
	phone: string;
	email: string;
	street: string;
	city: string;
	state: string;
	postalCode: string;
	emergencyContactName: string;
	emergencyContactRelationship: string;
	emergencyContactPhone: string;
	insuranceProvider: string;
	insurancePolicyNumber: string;
	insuranceGroupNumber: string;
	providerId: string;
};

export type PatientWriteInput = PatientDemographics & {
	practiceId?: string;
	portalUserId?: string | null;
};

export type PatientUpdateInput = Partial<PatientDemographics> & {
	practiceId?: string;
};

export type PatientSearchQuery = {
	q?: string;
	status?: PatientStatus;
	sort?: 'name-asc' | 'name-desc';
	page?: number;
	assignedToUserId?: string;
	portalUserId?: string;
};

export type PatientPage = {
	patients: Patient[];
	nextPage?: number;
	hasMore: boolean;
};

@Injectable()
export class PatientRepository {
	constructor(
		@InjectRepository(Patient)
		private readonly rows: Repository<Patient>,
		@InjectRepository(PatientAssignment)
		private readonly assignments: Repository<PatientAssignment>,
		private readonly tenant: TenantContext,
	) {}

	async list(): Promise<Patient[]> {
		const {practiceId} = this.tenant.require();
		return this.rows.find({
			where: {practiceId},
			order: {lastName: 'ASC', firstName: 'ASC'},
		});
	}

	async search(query: PatientSearchQuery): Promise<PatientPage> {
		const {practiceId} = this.tenant.require();
		const page = query.page ?? 1;
		const qb = this.rows
			.createQueryBuilder('patient')
			.where('patient.practiceId = :practiceId', {practiceId});

		if (query.assignedToUserId) {
			qb.innerJoin(
				PatientAssignment,
				'assignment',
				'assignment.patientId = patient.id AND assignment.userId = :assignedToUserId AND assignment.practiceId = :practiceId',
				{assignedToUserId: query.assignedToUserId},
			);
		}
		if (query.portalUserId) {
			qb.andWhere('patient.portalUserId = :portalUserId', {portalUserId: query.portalUserId});
		}
		if (query.status) {
			qb.andWhere('patient.status = :status', {status: query.status});
		}
		if (query.q) {
			qb.andWhere(
				`(patient.firstName ILIKE :q ESCAPE '\\' OR patient.lastName ILIKE :q ESCAPE '\\' OR patient.email ILIKE :q ESCAPE '\\' OR patient.phone ILIKE :q ESCAPE '\\' OR CAST(patient.id AS text) ILIKE :q ESCAPE '\\')`,
				{q: likePattern(query.q)},
			);
		}

		const direction = query.sort === 'name-desc' ? 'DESC' : 'ASC';
		qb.orderBy('patient.lastName', direction).addOrderBy('patient.firstName', direction);
		qb.skip((page - 1) * PATIENT_PAGE_SIZE).take(PATIENT_PAGE_SIZE);

		const [patients, total] = await qb.getManyAndCount();
		const hasMore = page * PATIENT_PAGE_SIZE < total;
		return {
			patients,
			hasMore,
			nextPage: hasMore ? page + 1 : undefined,
		};
	}

	async getById(id: string): Promise<Patient | undefined> {
		const {practiceId} = this.tenant.require();
		const row = await this.rows.findOne({where: {id, practiceId}});
		return row ?? undefined;
	}

	async isAssigned(patientId: string, userId: string): Promise<boolean> {
		const {practiceId} = this.tenant.require();
		const row = await this.assignments.findOne({
			where: {patientId, userId, practiceId},
		});
		return row !== null;
	}

	async create(input: PatientWriteInput): Promise<Patient> {
		const {practiceId} = this.tenant.require();
		this.rejectMismatchedPracticeId(input.practiceId, practiceId);
		const row = this.rows.create({
			practiceId,
			firstName: input.firstName,
			lastName: input.lastName,
			dateOfBirth: input.dateOfBirth,
			gender: input.gender,
			status: input.status,
			phone: input.phone,
			email: input.email,
			street: input.street,
			city: input.city,
			state: input.state,
			postalCode: input.postalCode,
			emergencyContactName: input.emergencyContactName,
			emergencyContactRelationship: input.emergencyContactRelationship,
			emergencyContactPhone: input.emergencyContactPhone,
			insuranceProvider: input.insuranceProvider,
			insurancePolicyNumber: input.insurancePolicyNumber,
			insuranceGroupNumber: input.insuranceGroupNumber,
			assignedProviderUserId: input.providerId,
			portalUserId: input.portalUserId ?? null,
			synthetic: true,
		});
		const saved = await this.rows.save(row);
		await this.ensureAssignment(saved.id, input.providerId);
		return saved;
	}

	async update(id: string, input: PatientUpdateInput): Promise<Patient | undefined> {
		const {practiceId} = this.tenant.require();
		this.rejectMismatchedPracticeId(input.practiceId, practiceId);
		const row = await this.getById(id);
		if (!row) {
			return undefined;
		}
		assignDefined(row, input);
		const saved = await this.rows.save(row);
		if (input.providerId !== undefined) {
			await this.ensureAssignment(saved.id, input.providerId);
		}
		return saved;
	}

	private async ensureAssignment(patientId: string, userId: string): Promise<void> {
		const {practiceId} = this.tenant.require();
		const existing = await this.assignments.findOne({
			where: {patientId, userId, practiceId},
		});
		if (existing) {
			return;
		}
		await this.assignments.save({practiceId, patientId, userId});
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

function assignDefined(row: Patient, input: PatientUpdateInput): void {
	if (input.firstName !== undefined) {
		row.firstName = input.firstName;
	}
	if (input.lastName !== undefined) {
		row.lastName = input.lastName;
	}
	if (input.dateOfBirth !== undefined) {
		row.dateOfBirth = input.dateOfBirth;
	}
	if (input.gender !== undefined) {
		row.gender = input.gender;
	}
	if (input.status !== undefined) {
		row.status = input.status;
	}
	if (input.phone !== undefined) {
		row.phone = input.phone;
	}
	if (input.email !== undefined) {
		row.email = input.email;
	}
	if (input.street !== undefined) {
		row.street = input.street;
	}
	if (input.city !== undefined) {
		row.city = input.city;
	}
	if (input.state !== undefined) {
		row.state = input.state;
	}
	if (input.postalCode !== undefined) {
		row.postalCode = input.postalCode;
	}
	if (input.emergencyContactName !== undefined) {
		row.emergencyContactName = input.emergencyContactName;
	}
	if (input.emergencyContactRelationship !== undefined) {
		row.emergencyContactRelationship = input.emergencyContactRelationship;
	}
	if (input.emergencyContactPhone !== undefined) {
		row.emergencyContactPhone = input.emergencyContactPhone;
	}
	if (input.insuranceProvider !== undefined) {
		row.insuranceProvider = input.insuranceProvider;
	}
	if (input.insurancePolicyNumber !== undefined) {
		row.insurancePolicyNumber = input.insurancePolicyNumber;
	}
	if (input.insuranceGroupNumber !== undefined) {
		row.insuranceGroupNumber = input.insuranceGroupNumber;
	}
	if (input.providerId !== undefined) {
		row.assignedProviderUserId = input.providerId;
	}
}

function likePattern(raw: string): string {
	const escaped = raw.replace(/[\\%_]/g, (character) => `\\${character}`);
	return `%${escaped}%`;
}
