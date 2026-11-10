import {describe, expect, it} from 'vitest';
import {MOCK_CALL_SCENARIOS, parseMockCallScenario} from '@/lib/telehealth/mock-call-scenario';

describe('parseMockCallScenario', () => {
	it.each(MOCK_CALL_SCENARIOS)('accepts %s', (scenario) => {
		expect(parseMockCallScenario(scenario)).toBe(scenario);
	});

	it.each([null, undefined, '', 'unknown', 'WAITING'])('ignores %s', (value) => {
		expect(parseMockCallScenario(value)).toBeUndefined();
	});
});
