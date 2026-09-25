import {Module} from '@nestjs/common';
import {APP_GUARD} from '@nestjs/core';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuditModule} from '../audit/audit.module.js';
import {AuthSession} from '../persistence/entities/auth-session.entity.js';
import {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import {User} from '../persistence/entities/user.entity.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {AuthController} from './auth.controller.js';
import {AuthGuard} from './auth.guard.js';
import {AuthService} from './auth.service.js';
import {CLOCK, systemClock} from './clock.js';
import {IdentityMembershipLookup} from './membership-lookup.js';
import {defaultMockIdpAccounts, MOCK_IDP_USERS} from './mock-idp.js';
import {PermissionsGuard} from './permissions.guard.js';
import {SessionRepository} from './session.repository.js';

@Module({
	imports: [
		TenancyModule,
		AuditModule,
		TypeOrmModule.forFeature([User, PracticeMembership, AuthSession]),
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		SessionRepository,
		IdentityMembershipLookup,
		{provide: MOCK_IDP_USERS, useValue: defaultMockIdpAccounts},
		{provide: CLOCK, useValue: systemClock},
		{provide: APP_GUARD, useClass: AuthGuard},
		{provide: APP_GUARD, useClass: PermissionsGuard},
	],
	exports: [AuthService, MOCK_IDP_USERS, CLOCK],
})
export class IdentityModule {}
