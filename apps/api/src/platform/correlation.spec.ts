import {describe, expect, it} from 'vitest';
import {resolveCorrelationId} from './correlation.js';

describe('resolveCorrelationId', () => {
	it('uses a non-empty incoming header value', () => {
		expect(resolveCorrelationId('  abc-123  ')).toBe('abc-123');
	});

	it('generates a UUID when the header is missing or blank', () => {
		const generated = resolveCorrelationId(undefined);
		expect(generated).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);
		expect(resolveCorrelationId('   ')).not.toBe('   ');
	});
});
