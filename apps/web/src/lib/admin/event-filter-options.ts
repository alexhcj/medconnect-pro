/**
 * Known action and resource-type values emitted by the Nest audit writers. The API accepts any
 * text, so this list only drives the filter selects; a new action needs one line here.
 */
export const AUDIT_ACTION_OPTIONS = [
	'access.denied',
	'appointment.created',
	'auth.login.failed',
	'auth.login.succeeded',
	'auth.logout',
	'auth.mfa.succeeded',
	'auth.rate_limited',
	'document.downloaded',
	'document.uploaded',
	'history.created',
	'history.listed',
	'invoice.created',
	'invoice.viewed',
	'membership.role_changed',
	'notification.enqueued',
	'notification_preference.updated',
	'patient.accessed',
	'patient.created',
	'payment.recorded',
	'telehealth_session.created',
	'telehealth_session.ended',
	'telehealth_session.joined',
	'vital.created',
] as const;

export const SECURITY_ACTION_OPTIONS = AUDIT_ACTION_OPTIONS.filter((action) =>
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
