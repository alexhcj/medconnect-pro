import {AuthSession} from './auth-session.entity.js';
import {PatientAssignment} from './patient-assignment.entity.js';
import {Patient} from './patient.entity.js';
import {PracticeMembership} from './practice-membership.entity.js';
import {Practice} from './practice.entity.js';
import {User} from './user.entity.js';

export const persistenceEntities = [
	Practice,
	User,
	PracticeMembership,
	Patient,
	PatientAssignment,
	AuthSession,
];

export {AuthSession, Patient, PatientAssignment, Practice, PracticeMembership, User};
