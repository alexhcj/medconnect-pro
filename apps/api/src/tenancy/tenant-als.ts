import {AsyncLocalStorage} from 'node:async_hooks';

export type TenantAlsStore = {
	practiceId: string;
};

export const tenantAls = new AsyncLocalStorage<TenantAlsStore>();
