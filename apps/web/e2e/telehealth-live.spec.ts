import {expect, test, type Browser, type BrowserContext, type Page} from '@playwright/test';
import {
	mutationHeaders,
	nestApiBase,
	NURSE_STATE,
	openDashboard,
	PATIENT_STATE,
	PROVIDER_STATE,
} from './helpers/live-session';

/**
 * QA-014: the seeded in-window visit with three participants in three browser contexts (provider,
 * Avery Quinn, her assigned MFA nurse). The local API uses the Fake Daily adapter, so this asserts
 * UI and API behavior, not media. With no real room the stage reads "not configured", which is not a
 * joined state, so the UI heartbeat timer never starts here; the heartbeat route is checked at the
 * API instead, and the timer is covered by `use-visit-keepalive` unit tests and the Render run.
 * The receptionist cannot sign in locally; that rule is in the API authorization matrix.
 *
 * One test on purpose: ending the visit is final until the next `seed:mock-identity`.
 */
const SESSION_URL = /\/dashboard\/telehealth\/([0-9a-f-]{36})$/;

async function newParticipant(browser: Browser, storageState: string): Promise<{context: BrowserContext; page: Page}> {
	const context = await browser.newContext({
		storageState,
		viewport: {width: 768, height: 1024},
		permissions: ['camera', 'microphone'],
	});
	return {context, page: await context.newPage()};
}

/** Lobby -> session page -> green room -> Join. Returns the session id. */
async function joinSeededVisit(page: Page): Promise<string> {
	await page.goto('/dashboard/telehealth');
	await expect(page.getByRole('heading', {level: 1, name: 'Telehealth'})).toBeVisible();
	await page
		.getByRole('button', {name: 'Join visit'})
		.or(page.getByRole('link', {name: 'Join visit'}))
		.first()
		.click();
	await expect(page).toHaveURL(SESSION_URL);
	const greenRoom = page.getByRole('heading', {level: 2, name: /^Video visit/});
	const stage = page.getByRole('region', {name: 'Video visit', exact: true});
	await expect(greenRoom.or(stage)).toBeVisible();
	// The green room shows only while the session is `waiting` (the first joiner). A participant who
	// opens a visit that is already `in_session` lands on the stage directly (QA-014 finding).
	if (await greenRoom.isVisible()) {
		await page.getByRole('button', {name: 'Join visit', exact: true}).click();
	}
	await expect(stage).toBeVisible();
	return SESSION_URL.exec(page.url())![1];
}

async function heartbeat(page: Page, sessionId: string) {
	return page.request.post(`${nestApiBase}/telehealth/sessions/${sessionId}/heartbeat`, {
		headers: await mutationHeaders(page),
	});
}

test.describe('Live telehealth visit with three participants', () => {
	test.use({storageState: PROVIDER_STATE, viewport: {width: 768, height: 1024}});
	test.setTimeout(120_000);

	test('provider, patient and nurse share one visit; only the host ends it', async ({page, browser}) => {
		const passiveRequests: string[] = [];
		page.on('request', (request) => {
			if (request.headers()['x-mcp-activity'] === 'passive') {
				passiveRequests.push(new URL(request.url()).pathname);
			}
		});

		await openDashboard(page);
		await page.getByRole('button', {name: 'Open navigation'}).click();
		await page.getByRole('dialog').getByRole('link', {name: 'Telehealth'}).click();
		await expect(page).toHaveURL(/\/dashboard\/telehealth$/);
		await expect(page.getByText('Synthetic demo. Not a production telehealth deployment.')).toBeVisible();
		const visits = page.getByRole('list', {name: 'Telehealth visits'});
		await expect(visits).toContainText('Avery Quinn');
		await expect(visits).toContainText('Dr. Jordan Ellis');

		const providerSessionId = await joinSeededVisit(page);
		await expect(page).not.toHaveURL(/session-/);

		// Passive polls: the concurrent-session inventory carries the marker and nothing else does (BE-027).
		expect(passiveRequests.length).toBeGreaterThan(0);
		expect(new Set(passiveRequests)).toEqual(new Set(['/auth/sessions']));

		const patient = await newParticipant(browser, PATIENT_STATE);
		const nurse = await newParticipant(browser, NURSE_STATE);
		try {
			const patientSessionId = await joinSeededVisit(patient.page);
			const nurseSessionId = await joinSeededVisit(nurse.page);
			expect(patientSessionId).toBe(providerSessionId);
			expect(nurseSessionId).toBe(providerSessionId);

			// Heartbeat route: every participant gets 204 on an open visit (BE-027 / SEC-013).
			for (const participant of [page, patient.page, nurse.page]) {
				expect((await heartbeat(participant, providerSessionId)).status()).toBe(204);
			}

			// Host-only End visit: the provider is offered it; the patient and the nurse are not.
			await expect(page.getByRole('button', {name: 'End visit'})).toBeVisible();
			await expect(patient.page.getByRole('button', {name: 'End visit'})).toHaveCount(0);
			await expect(nurse.page.getByRole('button', {name: 'End visit'})).toHaveCount(0);

			// Leaving the call does not end the visit.
			await page.getByRole('button', {name: 'Leave call'}).click();
			await expect(page.getByText('You left the call. The visit is still open.')).toBeVisible();
			await expect(page).toHaveURL(SESSION_URL);
			await page.getByRole('button', {name: 'Rejoin call'}).click();
			await expect(page.getByRole('region', {name: 'Video visit', exact: true})).toBeVisible();

			await page.getByRole('button', {name: 'End visit'}).click();
			await page
				.getByRole('dialog', {name: 'End this visit for everyone?'})
				.getByRole('button', {name: 'End visit'})
				.click();
			await expect(page.getByRole('heading', {level: 2, name: 'Visit wrap-up · Avery Quinn'})).toBeVisible();
			await expect(page.getByRole('link', {name: 'Book follow-up'})).toBeVisible();

			// The others see the visit as closed after a reload, and the heartbeat no longer keeps it alive.
			for (const participant of [patient.page, nurse.page]) {
				await participant.reload();
				await expect(participant.getByRole('heading', {level: 2, name: 'Your visit has ended'})).toBeVisible();
				await expect(participant.getByRole('region', {name: 'Video visit', exact: true})).toBeHidden();
				expect([404, 409]).toContain((await heartbeat(participant, providerSessionId)).status());
			}
		} finally {
			await patient.context.close();
			await nurse.context.close();
		}
	});
});
