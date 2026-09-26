import {describe, expect, it} from 'vitest';
import {
	canCreateOrEndTelehealthSession,
	isVisitJoinParticipant,
	resolveTelehealthReadScope,
} from './telehealth-access.js';

const providerId = '00000000-0000-4000-8000-000000000012';
const portalId = '00000000-0000-4000-8000-000000000013';
const nurseId = '00000000-0000-4000-8000-000000000014';
const receptionistId = '00000000-0000-4000-8000-000000000015';

describe('telehealth access', () => {
	it('lets write:appointments roles create and end sessions', () => {
		expect(canCreateOrEndTelehealthSession('RECEPTIONIST')).toBe(true);
		expect(canCreateOrEndTelehealthSession('PROVIDER')).toBe(true);
		expect(canCreateOrEndTelehealthSession('PRACTICE_ADMIN')).toBe(true);
		expect(canCreateOrEndTelehealthSession('SUPER_ADMIN')).toBe(true);
		expect(canCreateOrEndTelehealthSession('NURSE')).toBe(false);
		expect(canCreateOrEndTelehealthSession('PATIENT')).toBe(false);
	});

	it('reuses appointment read scopes', () => {
		expect(resolveTelehealthReadScope('RECEPTIONIST')).toEqual({kind: 'practice'});
		expect(resolveTelehealthReadScope('NURSE')).toEqual({kind: 'assigned'});
		expect(resolveTelehealthReadScope('PATIENT')).toEqual({kind: 'own'});
	});

	it('allows the appointment provider, portal patient, and assigned nurse to join', () => {
		expect(
			isVisitJoinParticipant({
				actorUserId: providerId,
				providerUserId: providerId,
				portalUserId: portalId,
				isAssigned: false,
			}),
		).toBe(true);
		expect(
			isVisitJoinParticipant({
				actorUserId: portalId,
				providerUserId: providerId,
				portalUserId: portalId,
				isAssigned: false,
			}),
		).toBe(true);
		expect(
			isVisitJoinParticipant({
				actorUserId: nurseId,
				providerUserId: providerId,
				portalUserId: portalId,
				isAssigned: true,
			}),
		).toBe(true);
	});

	it('does not let a receptionist or unassigned nurse join', () => {
		expect(
			isVisitJoinParticipant({
				actorUserId: receptionistId,
				providerUserId: providerId,
				portalUserId: portalId,
				isAssigned: false,
			}),
		).toBe(false);
		expect(
			isVisitJoinParticipant({
				actorUserId: nurseId,
				providerUserId: providerId,
				portalUserId: portalId,
				isAssigned: false,
			}),
		).toBe(false);
	});
});
