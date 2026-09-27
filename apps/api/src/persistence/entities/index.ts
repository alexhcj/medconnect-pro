import {Appointment} from './appointment.entity.js';
import {AuditEvent} from './audit-event.entity.js';
import {AuthSession} from './auth-session.entity.js';
import {ClinicalCondition} from './clinical-condition.entity.js';
import {ClinicalHistory} from './clinical-history.entity.js';
import {InvoiceLineItem} from './invoice-line-item.entity.js';
import {Invoice} from './invoice.entity.js';
import {Medication} from './medication.entity.js';
import {NotificationPreference} from './notification-preference.entity.js';
import {Notification} from './notification.entity.js';
import {PatientAssignment} from './patient-assignment.entity.js';
import {PatientDocument} from './patient-document.entity.js';
import {Patient} from './patient.entity.js';
import {Payment} from './payment.entity.js';
import {PracticeMembership} from './practice-membership.entity.js';
import {Practice} from './practice.entity.js';
import {TelehealthSession} from './telehealth-session.entity.js';
import {User} from './user.entity.js';
import {Vital} from './vital.entity.js';

export const persistenceEntities = [
	Practice,
	User,
	PracticeMembership,
	Patient,
	PatientAssignment,
	PatientDocument,
	AuthSession,
	Appointment,
	AuditEvent,
	ClinicalHistory,
	ClinicalCondition,
	Vital,
	Medication,
	TelehealthSession,
	Invoice,
	InvoiceLineItem,
	Payment,
	Notification,
	NotificationPreference,
];

export {
	Appointment,
	AuditEvent,
	AuthSession,
	ClinicalCondition,
	ClinicalHistory,
	Invoice,
	InvoiceLineItem,
	Medication,
	Notification,
	NotificationPreference,
	Patient,
	PatientAssignment,
	PatientDocument,
	Payment,
	Practice,
	PracticeMembership,
	TelehealthSession,
	User,
	Vital,
};
