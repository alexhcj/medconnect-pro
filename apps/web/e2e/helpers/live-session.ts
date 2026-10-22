import path from 'node:path';
import {expect, type Page} from '@playwright/test';

/**
 * Live specs sign in once per run (see `live.setup.ts`) and reuse that session, because the API
 * allows 5 password sign-ins per account per 15 minutes. Only the `auth-*-live` specs sign in
 * for real.
 */
export const ADMIN_STATE = path.join(__dirname, '..', '.auth', 'admin.json');
export const PROVIDER_STATE = path.join(__dirname, '..', '.auth', 'provider.json');

export const nestApiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export async function mutationHeaders(page: Page): Promise<Record<string, string>> {
	const cookies = await page.context().cookies(nestApiBase);
	const csrf = cookies.find((cookie) => cookie.name === 'mcp_csrf')?.value;
	const headers: Record<string, string> = {'Content-Type': 'application/json'};
	if (csrf) {
		headers['X-CSRF-Token'] = csrf;
	}
	return headers;
}

/** Opens the dashboard with the saved session; replaces a per-spec sign-in. */
export async function openDashboard(page: Page) {
	await page.goto('/dashboard');
	await expect(page).toHaveURL(/\/dashboard$/);
	await expect(page.getByRole('heading', {level: 1, name: 'Dashboard'})).toBeVisible();
}
