import {describe, expect, it} from 'vitest';
import {
	canCreateInvoice,
	canReadOwnBilling,
	canReadPracticeBilling,
	canRecordPayment,
	resolveBillingReadScope,
} from './billing-access.js';

describe('billing access', () => {
	it('grants practice-wide reads to admin, receptionist, provider, and super admin', () => {
		expect(canReadPracticeBilling('PRACTICE_ADMIN')).toBe(true);
		expect(canReadPracticeBilling('RECEPTIONIST')).toBe(true);
		expect(canReadPracticeBilling('PROVIDER')).toBe(true);
		expect(canReadPracticeBilling('SUPER_ADMIN')).toBe(true);
		expect(canReadPracticeBilling('NURSE')).toBe(false);
		expect(canReadPracticeBilling('PATIENT')).toBe(false);
	});

	it('limits portal users to own-billing reads', () => {
		expect(canReadOwnBilling('PATIENT')).toBe(true);
		expect(canReadOwnBilling('PRACTICE_ADMIN')).toBe(false);
		expect(resolveBillingReadScope('PATIENT')).toEqual({kind: 'own'});
		expect(resolveBillingReadScope('PROVIDER')).toEqual({kind: 'practice'});
		expect(resolveBillingReadScope('NURSE')).toBe('denied');
	});

	it('lets practice admins and receptionists create invoices, not providers or patients', () => {
		expect(canCreateInvoice('PRACTICE_ADMIN')).toBe(true);
		expect(canCreateInvoice('RECEPTIONIST')).toBe(true);
		expect(canCreateInvoice('SUPER_ADMIN')).toBe(true);
		expect(canCreateInvoice('PROVIDER')).toBe(false);
		expect(canCreateInvoice('NURSE')).toBe(false);
		expect(canCreateInvoice('PATIENT')).toBe(false);
	});

	it('lets practice staff and patients record payments, not providers or nurses', () => {
		expect(canRecordPayment('PRACTICE_ADMIN')).toBe(true);
		expect(canRecordPayment('RECEPTIONIST')).toBe(true);
		expect(canRecordPayment('SUPER_ADMIN')).toBe(true);
		expect(canRecordPayment('PATIENT')).toBe(true);
		expect(canRecordPayment('PROVIDER')).toBe(false);
		expect(canRecordPayment('NURSE')).toBe(false);
	});
});
