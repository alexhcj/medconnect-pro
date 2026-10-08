import {randomUUID} from 'node:crypto';
import request from 'supertest';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {canCreateInvoice, resolveBillingReadScope} from '../src/billing/billing-access.js';
import {syntheticPdfBytes} from '../src/documents/document-file.js';
import {canReadDocuments, canUploadDocuments} from '../src/documents/document-access.js';
import {
	canReadClinical,
	canWriteClinical,
	type ClinicalResourceKind,
} from '../src/ehr/clinical-access.js';
import {roleHasPermissions} from '../src/identity/permissions.js';
import {canWriteDemographics, resolvePatientReadScope} from '../src/patient/patient-access.js';
import {
	canWriteAppointments,
	resolveAppointmentReadScope,
} from '../src/scheduling/appointment-access.js';
import type {PracticeRole} from '../src/tenancy/practice-role.js';
import {
	canCreateOrEndTelehealthSession,
	isVisitJoinParticipant,
} from '../src/telehealth/telehealth-access.js';
import {
	createAuthorizationMatrixHarness,
	type AuthorizationMatrixHarness,
	type MatrixActor,
} from './authorization-matrix-harness.js';

const pdf = syntheticPdfBytes();
const STAFF_ACTORS = [
	'provider',
	'nurse',
	'receptionist',
	'patient',
	'practiceAdmin',
] as const satisfies readonly MatrixActor[];

type PatientTarget = 'assigned' | 'unassigned' | 'foreign';

type MatrixCase = {
	name: string;
	actor: MatrixActor;
	method: 'get' | 'post' | 'patch';
	path: (harness: AuthorizationMatrixHarness) => string;
	body?: (harness: AuthorizationMatrixHarness) => Record<string, unknown>;
	attachPdf?: boolean;
	expectedStatus: (harness: AuthorizationMatrixHarness) => number;
	leak?: 'practiceB';
};

let harness: AuthorizationMatrixHarness;
let tokens: Record<MatrixActor, string>;
let appointmentSlot = 0;
let vitalOffset = 0;

function patientId(harness: AuthorizationMatrixHarness, target: PatientTarget): string {
	if (target === 'assigned') {
		return harness.assignedPatientId;
	}
	if (target === 'unassigned') {
		return harness.unassignedPatientId;
	}
	return harness.foreignPatientId;
}

function patientGetStatus(role: PracticeRole, target: PatientTarget): number {
	const scope = resolvePatientReadScope(role);
	if (scope === 'denied') {
		return 403;
	}
	if (target === 'foreign') {
		return 404;
	}
	if (scope.kind === 'practice') {
		return 200;
	}
	if (scope.kind === 'assigned') {
		return target === 'assigned' ? 200 : 404;
	}
	return target === 'assigned' ? 200 : 404;
}

function clinicalStatus(
	role: PracticeRole,
	resource: ClinicalResourceKind,
	action: 'read' | 'write',
	target: PatientTarget,
): number {
	const visible = patientGetStatus(role, target);
	if (visible !== 200) {
		return visible;
	}
	if (action === 'read') {
		return canReadClinical(role, resource) ? 200 : 403;
	}
	return canWriteClinical(role, resource) ? 201 : 403;
}

function documentStatus(
	role: PracticeRole,
	action: 'read' | 'write',
	target: PatientTarget,
): number {
	const visible = patientGetStatus(role, target);
	if (visible !== 200) {
		return visible;
	}
	if (action === 'read') {
		return canReadDocuments(role) ? 200 : 403;
	}
	return canUploadDocuments(role) ? 201 : 403;
}

function appointmentGetStatus(role: PracticeRole, target: 'assigned' | 'foreign'): number {
	const scope = resolveAppointmentReadScope(role);
	if (scope === 'denied') {
		return 403;
	}
	if (target === 'foreign') {
		return 404;
	}
	if (scope.kind === 'practice') {
		return 200;
	}
	return 200;
}

function invoiceGetStatus(role: PracticeRole, target: 'assigned' | 'foreign'): number {
	const scope = resolveBillingReadScope(role);
	if (scope === 'denied') {
		return 403;
	}
	if (target === 'foreign') {
		return 404;
	}
	return 200;
}

function invoiceListStatus(role: PracticeRole): number {
	return resolveBillingReadScope(role) === 'denied' ? 403 : 200;
}

function joinStatus(harness: AuthorizationMatrixHarness, actor: MatrixActor): number {
	const role = harness.actors[actor].role;
	const read = resolveAppointmentReadScope(role);
	if (read === 'denied') {
		return 403;
	}
	if (
		isVisitJoinParticipant({
			actorUserId: harness.actors[actor].id,
			providerUserId: harness.providerId,
			portalUserId: harness.actors.patient.id,
			isAssigned: role === 'NURSE',
		})
	) {
		return 200;
	}
	return 403;
}

function nextAppointmentWindow(): {start: string; end: string} {
	const start = new Date(Date.UTC(2027, 5, 1, 10 + appointmentSlot, 0, 0));
	appointmentSlot += 2;
	return {
		start: start.toISOString(),
		end: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
	};
}

function nextVitalBody(): Record<string, unknown> {
	vitalOffset += 1;
	return {
		recordedAt: new Date(Date.UTC(2025, 6, 15, 10, vitalOffset, 0)).toISOString(),
		systolicMmHg: 128,
		diastolicMmHg: 82,
		heartRateBpm: 72,
		temperatureC: 36.7,
		respiratoryRate: 16,
		spo2Percent: 98,
		weightKg: 72.5,
	};
}

function historyBody(): Record<string, unknown> {
	return {
		type: 'visit',
		occurredAt: new Date(Date.UTC(2025, 6, 15, 11, vitalOffset, 0)).toISOString(),
		title: 'Synthetic follow-up',
		summary: 'Blood pressure stable on current medication.',
		status: 'completed',
	};
}

function buildCases(): MatrixCase[] {
	const cases: MatrixCase[] = [];
	for (const actor of STAFF_ACTORS) {
		const roleFor = (harness: AuthorizationMatrixHarness) => harness.actors[actor].role;
		cases.push(
			{
				name: `${actor} GET /patients`,
				actor,
				method: 'get',
				path: () => '/patients',
				expectedStatus: (harness) =>
					resolvePatientReadScope(roleFor(harness)) === 'denied' ? 403 : 200,
			},
			{
				name: `${actor} GET assigned patient`,
				actor,
				method: 'get',
				path: (harness) => `/patients/${patientId(harness, 'assigned')}`,
				expectedStatus: (harness) => patientGetStatus(roleFor(harness), 'assigned'),
			},
			{
				name: `${actor} GET unassigned patient`,
				actor,
				method: 'get',
				path: (harness) => `/patients/${patientId(harness, 'unassigned')}`,
				expectedStatus: (harness) => patientGetStatus(roleFor(harness), 'unassigned'),
			},
			{
				name: `${actor} GET foreign patient`,
				actor,
				method: 'get',
				path: (harness) => `/patients/${patientId(harness, 'foreign')}`,
				expectedStatus: (harness) => patientGetStatus(roleFor(harness), 'foreign'),
			},
			{
				name: `${actor} POST /patients`,
				actor,
				method: 'post',
				path: () => '/patients',
				body: (harness) => harness.patientBody(),
				expectedStatus: (harness) => (canWriteDemographics(roleFor(harness)) ? 201 : 403),
			},
			{
				name: `${actor} GET assigned vitals`,
				actor,
				method: 'get',
				path: (harness) => `/patients/${patientId(harness, 'assigned')}/vitals`,
				expectedStatus: (harness) => clinicalStatus(roleFor(harness), 'vitals', 'read', 'assigned'),
			},
			{
				name: `${actor} POST assigned vitals`,
				actor,
				method: 'post',
				path: (harness) => `/patients/${patientId(harness, 'assigned')}/vitals`,
				body: () => nextVitalBody(),
				expectedStatus: (harness) => clinicalStatus(roleFor(harness), 'vitals', 'write', 'assigned'),
			},
			{
				name: `${actor} POST assigned history`,
				actor,
				method: 'post',
				path: (harness) => `/patients/${patientId(harness, 'assigned')}/history`,
				body: () => historyBody(),
				expectedStatus: (harness) => clinicalStatus(roleFor(harness), 'history', 'write', 'assigned'),
			},
			{
				name: `${actor} GET assigned documents`,
				actor,
				method: 'get',
				path: (harness) => `/patients/${patientId(harness, 'assigned')}/documents`,
				expectedStatus: (harness) => documentStatus(roleFor(harness), 'read', 'assigned'),
			},
			{
				name: `${actor} POST assigned documents`,
				actor,
				method: 'post',
				path: (harness) => `/patients/${patientId(harness, 'assigned')}/documents`,
				attachPdf: true,
				expectedStatus: (harness) => documentStatus(roleFor(harness), 'write', 'assigned'),
			},
			{
				name: `${actor} GET assigned appointment`,
				actor,
				method: 'get',
				path: (harness) => `/appointments/${harness.appointmentId}`,
				expectedStatus: (harness) => appointmentGetStatus(roleFor(harness), 'assigned'),
			},
			{
				name: `${actor} POST /appointments`,
				actor,
				method: 'post',
				path: () => '/appointments',
				body: (harness) => ({
					patientId: harness.assignedPatientId,
					providerId: harness.providerId,
					...nextAppointmentWindow(),
					type: 'follow_up',
					state: 'scheduled',
				}),
				expectedStatus: (harness) => (canWriteAppointments(roleFor(harness)) ? 201 : 403),
			},
			{
				name: `${actor} POST /telehealth/sessions`,
				actor,
				method: 'post',
				path: () => '/telehealth/sessions',
				body: (harness) => ({appointmentId: harness.createSessionAppointmentId}),
				expectedStatus: (harness) =>
					canCreateOrEndTelehealthSession(roleFor(harness)) ? 201 : 403,
			},
			{
				name: `${actor} POST telehealth join`,
				actor,
				method: 'post',
				path: (harness) => `/telehealth/sessions/${harness.joinSessionId}/join`,
				expectedStatus: (h) => joinStatus(h, actor),
			},
			{
				name: `${actor} POST telehealth media-token`,
				actor,
				method: 'post',
				path: (harness) => `/telehealth/sessions/${harness.joinSessionId}/media-token`,
				expectedStatus: (h) => joinStatus(h, actor),
			},
			{
				name: `${actor} GET /billing/invoices`,
				actor,
				method: 'get',
				path: () => '/billing/invoices',
				expectedStatus: (harness) => invoiceListStatus(roleFor(harness)),
			},
			{
				name: `${actor} GET /notifications`,
				actor,
				method: 'get',
				path: () => '/notifications',
				expectedStatus: () => 200,
			},
			{
				name: `${actor} GET /dashboard/overview`,
				actor,
				method: 'get',
				path: () => '/dashboard/overview',
				expectedStatus: () => 200,
			},
			{
				name: `${actor} GET assigned invoice`,
				actor,
				method: 'get',
				path: (harness) => `/billing/invoices/${harness.invoiceId}`,
				expectedStatus: (harness) => invoiceGetStatus(roleFor(harness), 'assigned'),
			},
			{
				name: `${actor} POST /billing/invoices`,
				actor,
				method: 'post',
				path: () => '/billing/invoices',
				body: (harness) => ({
					patientId: harness.assignedPatientId,
					dueAt: '2027-06-15T00:00:00.000Z',
					lineItems: [{description: 'Office visit', amountCents: 12000}],
				}),
				expectedStatus: (harness) => (canCreateInvoice(roleFor(harness)) ? 201 : 403),
			},
			{
				name: `${actor} GET foreign invoice`,
				actor,
				method: 'get',
				path: (harness) => `/billing/invoices/${harness.foreignInvoiceId}`,
				expectedStatus: (harness) => invoiceGetStatus(roleFor(harness), 'foreign'),
			},
			{
				name: `${actor} GET foreign appointment`,
				actor,
				method: 'get',
				path: (harness) => `/appointments/${harness.foreignAppointmentId}`,
				expectedStatus: (harness) => appointmentGetStatus(roleFor(harness), 'foreign'),
			},
			{
				name: `${actor} GET foreign telehealth session`,
				actor,
				method: 'get',
				path: (harness) => `/telehealth/sessions/${harness.foreignSessionId}`,
				expectedStatus: (harness) => appointmentGetStatus(roleFor(harness), 'foreign'),
			},
			{
				name: `${actor} GET /admin/audit-events`,
				actor,
				method: 'get',
				path: () => '/admin/audit-events',
				expectedStatus: (harness) =>
					roleHasPermissions(roleFor(harness), ['admin:practice']) ? 200 : 403,
			},
			{
				name: `${actor} GET /admin/security-events`,
				actor,
				method: 'get',
				path: () => '/admin/security-events',
				expectedStatus: (harness) =>
					roleHasPermissions(roleFor(harness), ['admin:practice']) ? 200 : 403,
			},
			{
				name: `${actor} GET /admin/users`,
				actor,
				method: 'get',
				path: () => '/admin/users',
				expectedStatus: (harness) =>
					roleHasPermissions(roleFor(harness), ['admin:users']) ? 200 : 403,
			},
			{
				name: `${actor} PATCH /admin/users/:id/roles`,
				actor,
				method: 'patch',
				path: (harness) => `/admin/users/${harness.actors.provider.id}/roles`,
				body: () => ({role: 'PROVIDER'}),
				expectedStatus: (harness) =>
					roleHasPermissions(roleFor(harness), ['admin:users']) ? 200 : 403,
			},
		);
	}
	cases.push(
		{
			name: 'nurse GET unassigned vitals',
			actor: 'nurse',
			method: 'get',
			path: (harness) => `/patients/${harness.unassignedPatientId}/vitals`,
			expectedStatus: (harness) =>
				clinicalStatus(harness.actors.nurse.role, 'vitals', 'read', 'unassigned'),
		},
		{
			name: 'outsider GET assigned patient',
			actor: 'outsider',
			method: 'get',
			path: (harness) => `/patients/${harness.assignedPatientId}`,
			expectedStatus: () => 404,
		},
		{
			name: 'outsider GET /notifications',
			actor: 'outsider',
			method: 'get',
			path: () => '/notifications',
			expectedStatus: () => 200,
		},
		{
			name: 'receptionist POST patients with client practiceId',
			actor: 'receptionist',
			method: 'post',
			path: () => '/patients',
			body: (harness) => ({
				...harness.patientBody({
					email: `mismatch.${randomUUID().slice(0, 8)}@synthetic.example`,
					lastName: `Mismatch${harness.suffix}`,
				}),
				practiceId: harness.practiceBId,
			}),
			expectedStatus: () => 403,
			leak: 'practiceB',
		},
	);
	return cases;
}

const cases = buildCases();

describe('authorization matrix HTTP', () => {
	beforeAll(async () => {
		harness = await createAuthorizationMatrixHarness();
		tokens = {
			provider: await harness.login(harness.actors.provider.email),
			nurse: await harness.login(harness.actors.nurse.email),
			receptionist: await harness.login(harness.actors.receptionist.email),
			patient: await harness.login(harness.actors.patient.email),
			practiceAdmin: await harness.login(harness.actors.practiceAdmin.email),
			outsider: await harness.login(harness.actors.outsider.email),
		};
	});

	afterAll(async () => {
		await harness?.dispose();
	});

	it.each(cases)('$name', async (testCase) => {
		const expected = testCase.expectedStatus(harness);
		const req = request(harness.app.getHttpServer())
			[testCase.method](testCase.path(harness))
			.set('Authorization', `Bearer ${tokens[testCase.actor]}`);
		if (testCase.attachPdf) {
			req.field('category', 'intake').attach('file', pdf, 'matrix.pdf');
		} else if (testCase.body) {
			req.send(testCase.body(harness));
		}
		const response = await req.expect(expected);
		if (expected === 403) {
			expect(response.body.error.code).toBe('FORBIDDEN');
		}
		const raw = JSON.stringify(response.body);
		if (expected === 404) {
			expect(response.body.error.code).toBe('NOT_FOUND');
			expect(raw).not.toContain(harness.assignedLastName);
			expect(raw).not.toContain(harness.unassignedLastName);
			expect(raw).not.toContain(harness.foreignLastName);
			expect(raw).not.toContain(harness.practiceAId);
			expect(raw).not.toContain(harness.practiceBId);
		}
		if (testCase.leak === 'practiceB') {
			expect(raw).not.toContain(harness.practiceBId);
		}
	});
});
