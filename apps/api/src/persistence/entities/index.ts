import {Appointment} from './appointment.entity.js';
import {AuditEvent} from './audit-event.entity.js';
import {AuthSession} from './auth-session.entity.js';
import {ClinicalCondition} from './clinical-condition.entity.js';
import {ClinicalHistory} from './clinical-history.entity.js';
import {Medication} from './medication.entity.js';
import {PatientAssignment} from './patient-assignment.entity.js';
import {Patient} from './patient.entity.js';
import {PracticeMembership} from './practice-membership.entity.js';
import {Practice} from './practice.entity.js';
import {User} from './user.entity.js';
import {Vital} from './vital.entity.js';

export const persistenceEntities = [
	Practice,
	User,
	PracticeMembership,
	Patient,
	PatientAssignment,
	AuthSession,
	Appointment,
	AuditEvent,
	ClinicalHistory,
	ClinicalCondition,
	Vital,
	Medication,
];

export {
	Appointment,
	AuditEvent,
	AuthSession,
	ClinicalCondition,
	ClinicalHistory,
	Medication,
	Patient,
	PatientAssignment,
	Practice,
	PracticeMembership,
	User,
	Vital,
};
