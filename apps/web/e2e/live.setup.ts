import {test as setup} from '@playwright/test';
import {ADMIN_STATE, NURSE_STATE, PATIENT_STATE, PROVIDER_STATE} from './helpers/live-session';
import {
	signInAsLiveProvider,
	signInAsMfaNurse,
	signInAsPatient,
	signInAsPracticeAdmin,
} from './helpers/mock-auth';

setup('sign in as the practice admin once', async ({page}) => {
	await signInAsPracticeAdmin(page);
	await page.context().storageState({path: ADMIN_STATE});
});

setup('sign in as the live provider once', async ({page}) => {
	await signInAsLiveProvider(page);
	await page.context().storageState({path: PROVIDER_STATE});
});

// QA-014: the second and third visit participants. The patient is Avery Quinn, the nurse is the
// MFA nurse assigned to her, so both are on the seeded visit's roster.
setup('sign in as the portal patient once', async ({page}) => {
	await signInAsPatient(page);
	await page.context().storageState({path: PATIENT_STATE});
});

setup('sign in as the MFA nurse once', async ({page}) => {
	await signInAsMfaNurse(page);
	await page.context().storageState({path: NURSE_STATE});
});
