import {expect, test} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

test.describe('Live dashboard overview', () => {
	test('shows seeded patient-count and today appointment cards', async ({page}) => {
		await signInAsPracticeAdmin(page);

		const patients = page.getByRole('heading', {level: 3, name: 'Total Patients'});
		const today = page.getByRole('heading', {level: 3, name: "Today's Appointments"});
		await expect(patients).toBeVisible();
		await expect(today).toBeVisible();
		await expect(page.getByRole('heading', {level: 3, name: 'Patient Satisfaction'})).toHaveCount(0);

		const patientsCard = page.locator('div.rounded-lg.border').filter({has: patients});
		const todayCard = page.locator('div.rounded-lg.border').filter({has: today});
		await expect(patientsCard).toContainText(/\d/);
		await expect(todayCard).toContainText(/\d/);
		await expect(patientsCard).not.toContainText('2,834');
	});
});
