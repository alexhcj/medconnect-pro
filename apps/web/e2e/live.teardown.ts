import {test as teardown} from '@playwright/test';
import {ADMIN_STATE, mutationHeaders, nestApiBase, PROVIDER_STATE} from './helpers/live-session';

// Revoke the shared sessions so a finished run leaves no open session behind.
for (const [name, state] of [
	['practice admin', ADMIN_STATE],
	['live provider', PROVIDER_STATE],
] as const) {
	teardown(`sign out the shared ${name} session`, async ({browser}) => {
		const context = await browser.newContext({storageState: state});
		const page = await context.newPage();
		await page.request.post(`${nestApiBase}/auth/logout`, {headers: await mutationHeaders(page)});
		await context.close();
	});
}
