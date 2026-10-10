import {Module} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import type {Env} from '../platform/env.schema.js';
import {APP_GUARD} from '@nestjs/core';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuditModule} from '../audit/audit.module.js';
import {AuthSession} from '../persistence/entities/auth-session.entity.js';
import {ExternalIdentity} from '../persistence/entities/external-identity.entity.js';
import {OAuthFlowState} from '../persistence/entities/oauth-flow-state.entity.js';
import {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import {User} from '../persistence/entities/user.entity.js';
import {RateLimitGuard} from '../rate-limit/rate-limit.guard.js';
import {RateLimitModule} from '../rate-limit/rate-limit.module.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {AuthController} from './auth.controller.js';
import {AuthGuard} from './auth.guard.js';
import {AuthService} from './auth.service.js';
import {CLOCK, systemClock} from './clock.js';
import {ExternalIdentityRepository} from './external-identity.repository.js';
import {OAuthFlowStateRepository} from './oauth-flow-state.repository.js';
import {IdentityMembershipLookup} from './membership-lookup.js';
import {defaultMockIdpAccounts, MOCK_IDP_USERS} from './mock-idp.js';
import {PermissionsGuard} from './permissions.guard.js';
import {OAuthController} from './oauth.controller.js';
import {OAuthService} from './oauth.service.js';
import {createOidcProvider} from './oidc/oidc-provider.factory.js';
import {OIDC_PROVIDER_PORT} from './oidc/oidc-provider.port.js';
import {SessionRepository} from './session.repository.js';

@Module({
	imports: [
		TenancyModule,
		AuditModule,
		RateLimitModule,
		TypeOrmModule.forFeature([
			User,
			PracticeMembership,
			AuthSession,
			ExternalIdentity,
			OAuthFlowState,
		]),
	],
	controllers: [AuthController, OAuthController],
	providers: [
		AuthService,
		OAuthService,
		{
			provide: OIDC_PROVIDER_PORT,
			useFactory: (config: ConfigService<Env, true>) =>
				createOidcProvider({
					APP_ENV: config.get('APP_ENV', {infer: true}),
					OIDC_PROVIDER: config.get('OIDC_PROVIDER', {infer: true}),
					OIDC_ISSUER: config.get('OIDC_ISSUER', {infer: true}),
					OIDC_CLIENT_ID: config.get('OIDC_CLIENT_ID', {infer: true}),
					OIDC_CLIENT_SECRET: config.get('OIDC_CLIENT_SECRET', {infer: true}),
					OIDC_REDIRECT_URI: config.get('OIDC_REDIRECT_URI', {infer: true}),
					OIDC_DEMO_EMAIL: config.get('OIDC_DEMO_EMAIL', {infer: true}),
				}),
			inject: [ConfigService],
		},
		SessionRepository,
		ExternalIdentityRepository,
		OAuthFlowStateRepository,
		IdentityMembershipLookup,
		{provide: MOCK_IDP_USERS, useValue: defaultMockIdpAccounts},
		{provide: CLOCK, useValue: systemClock},
		{provide: APP_GUARD, useClass: AuthGuard},
		{provide: APP_GUARD, useClass: RateLimitGuard},
		{provide: APP_GUARD, useClass: PermissionsGuard},
	],
	exports: [AuthService, MOCK_IDP_USERS, CLOCK],
})
export class IdentityModule {}
