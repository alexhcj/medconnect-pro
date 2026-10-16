import {fixtureDemoUsers} from '@/lib/api/mocks/fixtures';

/** Labeled mock MFA nurse code. Same value the mock IdP accepts. */
export const DEMO_MFA_CODE = '135790';

const DEMO_PANEL_ROWS = [
	{email: 'practice.admin@example.test', label: 'Practice admin'},
	{email: 'jordan.ellis@synthetic.example', label: 'Provider'},
	{email: 'mfa.nurse@example.test', label: 'MFA nurse'},
	{email: 'avery.quinn@synthetic.example', label: 'Patient'},
] as const;

export type DemoPanelAccount = {
	label: string;
	email: string;
	password: string;
};

/** Exact `true` only. Any other value, including unset, hides fixture passwords. */
export function showDemoAccounts(): boolean {
	return process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === 'true';
}

export function demoPanelAccounts(): DemoPanelAccount[] {
	return DEMO_PANEL_ROWS.map((row) => {
		const user = fixtureDemoUsers.find((item) => item.email === row.email);
		if (!user) {
			throw new Error(`Missing demo fixture ${row.email}`);
		}
		return {label: row.label, email: user.email, password: user.password};
	});
}
