import {describe, expect, it} from 'vitest';
import {
	localParticipantDisplayName,
	mediaTileInitials,
	remoteParticipantFallbackName,
} from '@/lib/telehealth/media-participant';
import type {TelehealthSession} from '@/types/medical/telehealth-session';

const session: TelehealthSession = {
	id: 'session-1',
	appointmentId: 'appt-1',
	patientName: 'Avery Quinn',
	providerName: 'Dr. Jordan Ellis',
	start: '2026-10-16T16:00:00.000Z',
	end: '2026-10-16T16:30:00.000Z',
	type: 'telehealth',
	state: 'in_session',
	synthetic: true,
};

describe('mediaTileInitials', () => {
	it('uses first and last initials', () => {
		expect(mediaTileInitials('Avery Quinn')).toBe('AQ');
		expect(mediaTileInitials('Dr. Jordan Ellis')).toBe('JE');
	});
});

describe('participant display names', () => {
	it('maps provider and patient roles onto session names', () => {
		expect(localParticipantDisplayName(session, 'PROVIDER')).toBe('Dr. Jordan Ellis');
		expect(localParticipantDisplayName(session, 'PATIENT')).toBe('Avery Quinn');
		expect(localParticipantDisplayName(session, 'NURSE')).toBe('You');
		expect(remoteParticipantFallbackName(session, 'PROVIDER')).toBe('Avery Quinn');
		expect(remoteParticipantFallbackName(session, 'PATIENT')).toBe('Dr. Jordan Ellis');
	});
});
