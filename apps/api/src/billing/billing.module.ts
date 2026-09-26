import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuditModule} from '../audit/audit.module.js';
import {InvoiceLineItem} from '../persistence/entities/invoice-line-item.entity.js';
import {Invoice} from '../persistence/entities/invoice.entity.js';
import {Payment} from '../persistence/entities/payment.entity.js';
import {PracticeModule} from '../practice/practice.module.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {BillingService} from './billing.service.js';
import {ClaimsController} from './claims.controller.js';
import {DemoPaymentGateway} from './demo-payment-gateway.js';
import {InvoiceController} from './invoice.controller.js';
import {InvoiceRepository} from './invoice.repository.js';
import {PAYMENT_GATEWAY} from './payment-gateway.js';
import {PaymentController} from './payment.controller.js';
import {PaymentRepository} from './payment.repository.js';

@Module({
	imports: [
		TenancyModule,
		PracticeModule,
		AuditModule,
		TypeOrmModule.forFeature([Invoice, InvoiceLineItem, Payment]),
	],
	controllers: [InvoiceController, PaymentController, ClaimsController],
	providers: [
		BillingService,
		InvoiceRepository,
		PaymentRepository,
		{provide: PAYMENT_GATEWAY, useClass: DemoPaymentGateway},
	],
})
export class BillingModule {}
