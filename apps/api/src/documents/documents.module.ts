import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuditModule} from '../audit/audit.module.js';
import {PatientDocument} from '../persistence/entities/patient-document.entity.js';
import {PracticeModule} from '../practice/practice.module.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {DOCUMENT_OBJECT_STORE} from './document-object-store.js';
import {DocumentService} from './document.service.js';
import {DocumentsController} from './documents.controller.js';
import {LocalDocumentObjectStore} from './local-document-object-store.js';
import {PatientDocumentRepository} from './patient-document.repository.js';

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
		{provide: DOCUMENT_OBJECT_STORE, useClass: LocalDocumentObjectStore},
	],
})
export class DocumentsModule {}
