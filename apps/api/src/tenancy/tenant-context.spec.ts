import {describe, expect, it} from 'vitest';
import {TenantContext} from './tenant-context.js';
import {TenantScopeMissingError} from './tenant-errors.js';

describe('TenantContext', () => {
	it('fails closed when scope is missing', () => {
		const tenant = new TenantContext();
		expect(() => tenant.require()).toThrow(TenantScopeMissingError);
	});

	it('returns the server-resolved scope after set', () => {
		const tenant = new TenantContext();
		tenant.set({
			practiceId: '11111111-1111-4111-8111-111111111111',
			actorUserId: '22222222-2222-4222-8222-222222222222',
			role: 'PROVIDER',
		});
		expect(tenant.require().practiceId).toBe('11111111-1111-4111-8111-111111111111');
	});

	it('fails closed after clear', () => {
		const tenant = new TenantContext();
		tenant.set({
			practiceId: '11111111-1111-4111-8111-111111111111',
			actorUserId: '22222222-2222-4222-8222-222222222222',
			role: 'NURSE',
		});
		tenant.clear();
		expect(() => tenant.require()).toThrow(TenantScopeMissingError);
	});
});
