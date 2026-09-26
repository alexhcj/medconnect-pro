import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Payment, type PaymentMethod} from '../persistence/entities/payment.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';

export type PaymentWriteInput = {
	invoiceId: string;
	amountCents: number;
	method: PaymentMethod;
	processorRef: string;
	practiceId?: string;
};

@Injectable()
export class PaymentRepository {
	constructor(
		@InjectRepository(Payment)
		private readonly rows: Repository<Payment>,
		private readonly tenant: TenantContext,
	) {}

	async create(input: PaymentWriteInput): Promise<Payment> {
		const {practiceId} = this.tenant.require();
		rejectMismatchedPracticeId(input.practiceId, practiceId);
		const row = this.rows.create({
			practiceId,
			invoiceId: input.invoiceId,
			amountCents: input.amountCents,
			method: input.method,
			processorRef: input.processorRef,
			status: 'recorded',
			synthetic: true,
		});
		return this.rows.save(row);
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
