import {InMemoryRateLimitStore} from '../src/rate-limit/in-memory-rate-limit-store.js';

/** Override `RATE_LIMIT_STORE` with this in HTTP specs; `vitest.setup.ts` resets it before every test. */
export const testRateLimitStore = new InMemoryRateLimitStore();
