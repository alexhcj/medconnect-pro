#!/usr/bin/env node
/**
 * Render API start. Derives DATABASE_URL when it is unset, then boots Nest.
 * Does not log the URL or the app-role password.
 */

import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {deriveRuntimeDatabaseUrl} from './derive-runtime-database-url.mjs';

function safeMessage(error) {
	const message = error instanceof Error ? error.message : 'Database command failed';
	if (message.includes('://') || message.toLowerCase().includes('password')) {
		return 'Database command failed';
	}
	return message;
}

if (!process.env.DATABASE_URL) {
	const adminUrl = process.env.DATABASE_ADMIN_URL;
	const password = process.env.APP_ROLE_PASSWORD;
	if (!adminUrl || !password?.trim()) {
		console.error('DATABASE_URL or both DATABASE_ADMIN_URL and APP_ROLE_PASSWORD are required');
		process.exit(1);
	}
	try {
		process.env.DATABASE_URL = deriveRuntimeDatabaseUrl(adminUrl, password);
	} catch (error) {
		console.error(safeMessage(error));
		process.exit(1);
	}
}

const dist = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'../../apps/api/dist/main.js',
);
await import(pathToFileURL(dist).href);
