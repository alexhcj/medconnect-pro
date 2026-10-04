import {S3Client} from '@aws-sdk/client-s3';
import {Module} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuditModule} from '../audit/audit.module.js';
import {PatientDocument} from '../persistence/entities/patient-document.entity.js';
import type {Env} from '../platform/env.schema.js';
import {PracticeModule} from '../practice/practice.module.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {DOCUMENT_OBJECT_STORE} from './document-object-store.js';
import {DocumentService} from './document.service.js';
import {DocumentsController} from './documents.controller.js';
import {LocalDocumentObjectStore} from './local-document-object-store.js';
import {PatientDocumentRepository} from './patient-document.repository.js';
import {S3DocumentObjectStore} from './s3-document-object-store.js';

@Module({
	imports: [
		TenancyModule,
		PracticeModule,
		AuditModule,
		TypeOrmModule.forFeature([PatientDocument]),
	],
	controllers: [DocumentsController],
	providers: [
		DocumentService,
		PatientDocumentRepository,
		{
			provide: DOCUMENT_OBJECT_STORE,
			useFactory: (config: ConfigService<Env, true>) => {
				const appEnv = config.get('APP_ENV', {infer: true});
				if (appEnv === 'preview' || appEnv === 'production') {
					const bucket = config.get('DOCUMENT_S3_BUCKET', {infer: true});
					if (!bucket) {
						throw new Error(
							'DOCUMENT_S3_BUCKET is required when APP_ENV is preview or production',
						);
					}
					return new S3DocumentObjectStore(bucket, new S3Client({}));
				}
				return new LocalDocumentObjectStore(config);
			},
			inject: [ConfigService],
		},
	],
})
export class DocumentsModule {}
