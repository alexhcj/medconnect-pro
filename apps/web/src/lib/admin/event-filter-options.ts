/**
 * Every action the Nest audit writers emit, sorted. Mirrors the `recordAudit`/`record` calls in
 * `apps/api/src/{audit,billing,documents,ehr,identity,notifications,patient,practice,scheduling,telehealth}`
 * (identity covers `auth.service.ts`, `oauth.service.ts` and the rate-limit auditor). The API accepts
 * any text, so this list only drives the filter selects; a new API action needs one line here.
 */
export const API_AUDIT_ACTIONS = [
	'access.denied',
	'appointment.created',
	'appointment.deleted',
	'appointment.updated',
	'auth.login.failed',
	'auth.login.succeeded',
	'auth.logout',
	'auth.logout_all',
	'auth.mfa.failed',
	'auth.mfa.succeeded',
	'auth.oauth.failed',
	'auth.oauth.identity_mismatch',
	'auth.oauth.linked',
	'auth.oauth.succeeded',
	'auth.rate_limited',
	'auth.refresh.reuse',
	'auth.session.revoked',
	'condition.created',
	'condition.listed',
	'document.downloaded',
	'document.listed',
	'document.uploaded',
	'history.created',
	'history.listed',
	'invoice.created',
	'medication.created',
	'medication.listed',
	'membership.role_changed',
	'notification.enqueued',
	'notification_preference.updated',
	'patient.accessed',
	'patient.created',
	'patient.updated',
	'payment.recorded',
	'telehealth_session.created',
	'telehealth_session.ended',
	'telehealth_session.joined',
	'telehealth_session.media_room_deleted',
	'telehealth_session.media_token_minted',
	'vital.created',
	'vital.listed',
] as const;

export type ApiAuditAction = (typeof API_AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_OPTIONS = API_AUDIT_ACTIONS;

/** The API selects security events by the `auth.` action prefix. */
export const SECURITY_ACTION_OPTIONS = API_AUDIT_ACTIONS.filter((action) =>
	action.startsWith('auth.'),
);

export const AUDIT_RESOURCE_TYPE_OPTIONS = [
	'admin',
	'appointment',
	'document',
	'history',
	'invoice',
	'notification',
	'notification_preference',
	'patient',
	'payment',
	'session',
	'telehealth_session',
	'user',
	'vital',
] as const;

export const SECURITY_RESOURCE_TYPE_OPTIONS = ['session'] as const;
