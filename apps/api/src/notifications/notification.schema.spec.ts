import {describe, expect, it} from 'vitest';
import {preferenceUpdateSchema} from './notification.schema.js';

describe('notification schemas', () => {
	it('rejects unknown preference fields', () => {
		const result = preferenceUpdateSchema.safeParse({
			emailEnabled: false,
			phoneNumber: '+15555550100',
		});
		expect(result.success).toBe(false);
	});

	it('accepts a subset of channel flags', () => {
		const result = preferenceUpdateSchema.safeParse({emailEnabled: false});
		expect(result.success).toBe(true);
	});
});
