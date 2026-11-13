/**
 * Mock-mode call scenarios (QA-014). `?mockState=<scenario>` on the session page makes the mock stage
 * show one TH-08 state or the room-closing notice so the mock e2e can cover them. Only the mock call
 * stage reads this; live mode (`DailyMediaSession`) never does, and nothing here reaches the API.
 */
export const MOCK_CALL_SCENARIOS = [
	'waiting',
	'participant-left',
	'reconnecting',
	'device-lost',
	'poor-network',
	'closing',
] as const;

export type MockCallScenario = (typeof MOCK_CALL_SCENARIOS)[number];

export const MOCK_CALL_SCENARIO_PARAM = 'mockState';

export function parseMockCallScenario(value: string | null | undefined): MockCallScenario | undefined {
	return MOCK_CALL_SCENARIOS.find((scenario) => scenario === value);
}
