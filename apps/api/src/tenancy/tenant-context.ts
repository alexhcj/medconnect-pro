import {Injectable, Scope} from '@nestjs/common';
import type {PracticeRole} from './practice-role.js';
import {TenantScopeMissingError} from './tenant-errors.js';

export type TenantScope = {
	practiceId: string;
	actorUserId: string;
	role: PracticeRole;
};

@Injectable({scope: Scope.REQUEST})
export class TenantContext {
	private current: TenantScope | undefined;

	set(scope: TenantScope): void {
		this.current = scope;
	}

	require(): TenantScope {
		if (!this.current) {
			throw new TenantScopeMissingError();
		}
		return this.current;
	}

	clear(): void {
		this.current = undefined;
	}
}
