import type {Provider} from '@/types/medical/provider';

/**
 * Assigned provider for live create/edit.
 * The id must match `LIVE_DEMO_PROVIDER_ID` in `apps/api/src/identity/seed-mock-identity.ts`.
 */
export const LIVE_DEMO_PROVIDER_ID = '11111111-1111-4111-8111-111111111111';

export const liveDemoProvider: Provider = {
	id: LIVE_DEMO_PROVIDER_ID,
	firstName: 'Jordan',
	lastName: 'Ellis',
	displayName: 'Dr. Jordan Ellis',
	specialty: 'Family Medicine',
	practiceId: '',
	synthetic: true,
};
