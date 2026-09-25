import {describe, expect, it} from 'vitest';
import {resourceTypeFromPath} from './audit-access.js';

describe('resourceTypeFromPath', () => {
	it('uses the first path segment and ignores query strings', () => {
		expect(resourceTypeFromPath('/patients/abc?practiceId=1')).toBe('patients');
		expect(resourceTypeFromPath('admin/audit-events')).toBe('admin');
	});

	it('returns unknown when the path has no segment', () => {
		expect(resourceTypeFromPath('/')).toBe('unknown');
		expect(resourceTypeFromPath('')).toBe('unknown');
	});
});
