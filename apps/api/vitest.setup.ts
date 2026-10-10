import 'reflect-metadata';
import {beforeEach} from 'vitest';
import {DEFAULT_DATABASE_ADMIN_URL, DEFAULT_DATABASE_URL} from './src/persistence/default-database-url.js';
import {testRateLimitStore} from './test/rate-limit-test-store.js';

process.env.DATABASE_URL ??= DEFAULT_DATABASE_URL;
process.env.DATABASE_ADMIN_URL ??= DEFAULT_DATABASE_ADMIN_URL;

beforeEach(() => {
	testRateLimitStore.reset();
});
