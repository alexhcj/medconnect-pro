import {test as setup} from '@playwright/test';
import {ADMIN_STATE, PROVIDER_STATE} from './helpers/live-session';
import {signInAsLiveProvider, signInAsPracticeAdmin} from './helpers/mock-auth';

setup('sign in as the practice admin once', async ({page}) => {
	await signInAsPracticeAdmin(page);
	await page.context().storageState({path: ADMIN_STATE});
});

setup('sign in as the live provider once', async ({page}) => {
	await signInAsLiveProvider(page);
	await page.context().storageState({path: PROVIDER_STATE});
});
