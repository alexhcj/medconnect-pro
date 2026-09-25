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
	private scope: TenantScope | undefined;

	set(scope: TenantScope): void {
		this.scope = scope;
	}

	current(): TenantScope | undefined {
		return this.scope;
	}

	require(): TenantScope {
		if (!this.scope) {
			throw new TenantScopeMissingError();
		}
		return this.scope;
	}

	clear(): void {
		this.scope = undefined;
	}
}
