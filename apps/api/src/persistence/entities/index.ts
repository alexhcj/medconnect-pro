import {Patient} from './patient.entity.js';
import {PracticeMembership} from './practice-membership.entity.js';
import {Practice} from './practice.entity.js';
import {User} from './user.entity.js';

export const persistenceEntities = [Practice, User, PracticeMembership, Patient];

export {Patient, Practice, PracticeMembership, User};
