import {describe, expect, it} from 'vitest';
import {isOwnRecipient} from './notification-access.js';

describe('notification access', () => {
	const actor = '00000000-0000-4000-8000-000000000010';
	const other = '00000000-0000-4000-8000-000000000011';

	it('allows only the session actor as recipient', () => {
		expect(isOwnRecipient(actor, actor)).toBe(true);
		expect(isOwnRecipient(actor, other)).toBe(false);
	});
});
