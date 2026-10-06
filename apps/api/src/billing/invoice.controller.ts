import {Body, Controller, Get, HttpCode, Param, Post} from '@nestjs/common';
import {
	ApiBody,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {ApiSessionAuth} from '../identity/auth.decorators.js';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {
	InvoiceCreateRequestRdo,
	InvoiceListRdo,
	InvoiceRdo,
} from './billing.rdo.js';
import {
	invoiceCreateSchema,
	invoiceIdParamsSchema,
	type InvoiceCreateBody,
	type InvoiceIdParams,
} from './billing.schema.js';
import {BillingService} from './billing.service.js';

@ApiTags('billing')
@ApiSessionAuth()
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('billing/invoices')
export class InvoiceController {
	constructor(private readonly billing: BillingService) {}

	@Get()
	@ApiOperation({
		summary: 'List invoices for the current tenant',
		description:
			'Practice admins, receptionists, providers, and super admins read practice invoices. Portal users read their own. Nurses are denied this practice-revenue surface. Tenant comes from the session, not from the client. synthetic is always true.',
	})
	@ApiOkResponse({type: InvoiceListRdo})
	list(): Promise<InvoiceListRdo> {
		return this.billing.listInvoices();
	}

	@Post()
	@HttpCode(201)
	@ApiOperation({
		summary: 'Create a synthetic invoice',
		description:
			'Requires write:billing for practice administrators and receptionists. PATIENT write:billing does not create invoices. amountCents is the sum of line items. Tenant comes from the session. Do not send card data.',
	})
	@ApiBody({type: InvoiceCreateRequestRdo})
	@ApiCreatedResponse({type: InvoiceRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	create(@Body({schema: invoiceCreateSchema}) body: InvoiceCreateBody): Promise<InvoiceRdo> {
		return this.billing.createInvoice(body);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Read one invoice',
		description:
			'Unknown ids, cross-tenant ids, and invoices outside the caller’s own-patient scope return the same not-found response. Issued invoices past dueAt are returned as overdue.',
	})
	@ApiOkResponse({type: InvoiceRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	get(@Param({schema: invoiceIdParamsSchema}) params: InvoiceIdParams): Promise<InvoiceRdo> {
		return this.billing.getInvoice(params.id);
	}
}
