import {expect, test, type Page} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

async function openInbox(page: Page) {
	await page.getByRole('button', {name: /^Notifications/}).click();
	await expect(page.getByRole('heading', {name: 'Notifications'})).toBeVisible();
}

async function openPreferences(page: Page) {
	await page.getByRole('button', {name: 'Preferences'}).click();
	await expect(page.getByRole('heading', {name: 'Preferences'})).toBeVisible();
}

test.describe('Live notifications inbox', () => {
	test('practice admin sees a self-scoped inbox, mark-read, and preferences', async ({page}) => {
		await signInAsPracticeAdmin(page);

		await openInbox(page);

		const list = page.getByRole('list', {name: 'Notifications'});
		await expect(list).toBeVisible();
		await expect(list).toContainText('Seeded inbox: census reminder');
		await expect(page.getByText("Seeded inbox: today's visits")).toHaveCount(0);
		await expect(page.getByText('Seeded inbox: follow-up queue')).toHaveCount(0);

		const unreadRow = list.locator('li').filter({has: page.getByRole('button', {name: 'Mark as read'})}).first();
		if (await unreadRow.count()) {
			const title = (await unreadRow.locator('p').first().innerText()).trim();
			await unreadRow.getByRole('button', {name: 'Mark as read'}).click();
			await expect(page.getByText('Notification marked as read')).toHaveCount(1);

			await page.reload();
			await openInbox(page);
			const after = page.getByRole('list', {name: 'Notifications'}).locator('li').filter({hasText: title});
			await expect(after.getByText('Read')).toBeVisible();
			await expect(after.getByRole('button', {name: 'Mark as read'})).toHaveCount(0);
		}

		await openPreferences(page);
		const email = page.getByRole('switch', {name: 'Email'});
		await expect(email).toBeVisible();
		const wasChecked = await email.isChecked();
		await email.click();
		await expect(page.getByText('Preferences saved')).toBeVisible();

		await page.reload();
		await openInbox(page);
		await openPreferences(page);
		await expect(page.getByRole('switch', {name: 'Email'})).toBeChecked({checked: !wasChecked});
		await page.getByRole('switch', {name: 'Email'}).click();
		await expect(page.getByText('Preferences saved')).toBeVisible();
	});
});
