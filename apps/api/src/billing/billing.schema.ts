import {z} from 'zod';
import {PAYMENT_METHODS} from '../persistence/entities/payment.entity.js';

const requiredText = (max: number) => z.string().trim().min(1).max(max);
const isoInstant = z.iso.datetime();

export const invoiceLineItemSchema = z
	.object({
		description: requiredText(200),
		amountCents: z.number().int().min(1).max(100_000_000),
	})
	.strict();

export const invoiceCreateSchema = z
	.object({
		patientId: z.uuid(),
		dueAt: isoInstant,
		currency: z.literal('USD').optional(),
		lineItems: z.array(invoiceLineItemSchema).min(1).max(20),
		practiceId: z.uuid().optional(),
	})
	.strict();

export type InvoiceCreateBody = z.infer<typeof invoiceCreateSchema>;

export const invoiceIdParamsSchema = z.object({
	id: z.uuid(),
});

export type InvoiceIdParams = z.infer<typeof invoiceIdParamsSchema>;

export const paymentCreateSchema = z
	.object({
		invoiceId: z.uuid(),
		method: z.enum(PAYMENT_METHODS),
		practiceId: z.uuid().optional(),
	})
	.strict();

export type PaymentCreateBody = z.infer<typeof paymentCreateSchema>;
