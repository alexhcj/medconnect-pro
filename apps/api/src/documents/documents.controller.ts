import {
	Controller,
	Get,
	Header,
	HttpCode,
	Param,
	Post,
	Req,
	StreamableFile,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {
	ApiBody,
	ApiConsumes,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type {Request} from 'express';
import {ApiSessionAuth} from '../identity/auth.decorators.js';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {RateLimit} from '../rate-limit/rate-limit.decorator.js';
import {RATE_LIMIT_POLICIES} from '../rate-limit/rate-limit.policies.js';
import {MAX_DOCUMENT_BYTES} from './document-file.js';
import {DocumentFileInvalidError} from './document.errors.js';
import {
	PatientDocumentListRdo,
	PatientDocumentRdo,
	PatientDocumentUploadRequestRdo,
} from './document.rdo.js';
import {
	documentContentParamsSchema,
	documentUploadFieldsSchema,
	patientIdParamsSchema,
	type DocumentContentParams,
	type PatientIdParams,
} from './document.schema.js';
import {DocumentService} from './document.service.js';

@ApiTags('documents')
@ApiSessionAuth()
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('patients/:id/documents')
export class DocumentsController {
	constructor(private readonly documents: DocumentService) {}

	@Get()
	@ApiOperation({
		summary: 'List documents for a patient',
		description:
			'Metadata only. Requires write:medical_records, or a portal user reading their own record. Tenant comes from the session. Object-store keys are not returned.',
	})
	@ApiOkResponse({type: PatientDocumentListRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	list(@Param({schema: patientIdParamsSchema}) params: PatientIdParams): Promise<PatientDocumentListRdo> {
		return this.documents.list(params.id);
	}

	@Post()
	@HttpCode(201)
	@UseInterceptors(
		FileInterceptor('file', {
			limits: {fileSize: MAX_DOCUMENT_BYTES, files: 1},
		}),
	)
	@ApiConsumes('multipart/form-data')
	@ApiOperation({
		summary: 'Upload a synthetic patient document',
		description:
			'Requires write:medical_records. Accepts PDF, PNG, or JPEG up to 5 MiB. Type is sniffed from magic bytes. synthetic is always stored as true. Bytes stay in the local object-store adapter, not PostgreSQL.',
	})
	@ApiBody({type: PatientDocumentUploadRequestRdo})
	@ApiCreatedResponse({type: PatientDocumentRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	upload(
		@Param({schema: patientIdParamsSchema}) params: PatientIdParams,
		@UploadedFile() file: {buffer: Buffer; originalname?: string} | undefined,
		@Req() request: Request,
	): Promise<PatientDocumentRdo> {
		const parsed = documentUploadFieldsSchema.safeParse(request.body ?? {});
		if (!parsed.success) {
			throw new DocumentFileInvalidError('category', 'Category must be intake, insurance, or clinical');
		}
		return this.documents.upload(params.id, parsed.data, file);
	}

	@Get(':documentId/content')
	@RateLimit(RATE_LIMIT_POLICIES.documentDownload)
	@ApiOperation({
		summary: 'Download a patient document',
		description:
			'Authorized octet-stream. Requires write:medical_records, or a portal user reading their own record. Not a public blob URL.',
	})
	@ApiOkResponse({
		description: 'Authorized file bytes',
		content: {
			'application/pdf': {schema: {type: 'string', format: 'binary'}},
			'image/png': {schema: {type: 'string', format: 'binary'}},
			'image/jpeg': {schema: {type: 'string', format: 'binary'}},
		},
	})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	@Header('X-Content-Type-Options', 'nosniff')
	async download(
		@Param({schema: documentContentParamsSchema}) params: DocumentContentParams,
	): Promise<StreamableFile> {
		const result = await this.documents.download(params.id, params.documentId);
		return new StreamableFile(result.bytes, {
			type: result.contentType,
			disposition: contentDisposition(result.name),
		});
	}
}

function contentDisposition(name: string): string {
	const ascii = name.replace(/[^\u0020-\u007E]/g, '_').replaceAll('"', '');
	return `attachment; filename="${ascii || 'document'}"`;
}
