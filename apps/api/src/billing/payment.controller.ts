import {Body, Controller, HttpCode, Post} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {PaymentCreateRequestRdo, PaymentRdo} from './billing.rdo.js';
import {paymentCreateSchema, type PaymentCreateBody} from './billing.schema.js';
import {BillingService} from './billing.service.js';

@ApiTags('billing')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('billing/payments')
export class PaymentController {
	constructor(private readonly billing: BillingService) {}

	@Post()
	@HttpCode(201)
	@ApiOperation({
		summary: 'Record a synthetic payment against an invoice',
		description:
			'Stripe/ACH adapter boundary. Accepts invoiceId and method only. Does not store or accept card or bank account numbers. Marks the invoice paid through a demo processor that does not call Stripe. Paid invoices conflict.',
	})
	@ApiBody({type: PaymentCreateRequestRdo})
	@ApiCreatedResponse({type: PaymentRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	@ApiConflictResponse({type: ErrorEnvelopeRdo})
	create(@Body({schema: paymentCreateSchema}) body: PaymentCreateBody): Promise<PaymentRdo> {
		return this.billing.recordPayment(body);
	}
}
