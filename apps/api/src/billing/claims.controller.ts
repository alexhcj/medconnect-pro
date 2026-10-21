import {Controller, Get, Query} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {ApiSessionAuth} from '../identity/auth.decorators.js';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {ClaimListRdo} from './billing.rdo.js';
import {claimListQuerySchema, type ClaimListQuery} from './billing.schema.js';
import {BillingService} from './billing.service.js';

@ApiTags('billing')
@ApiSessionAuth()
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('billing/claims')
export class ClaimsController {
	constructor(private readonly billing: BillingService) {}

	@Get()
	@ApiOperation({
		summary: 'List claims envelopes for visible invoices',
		description:
			'Labeled EDI 837 boundary. Returns not_submitted envelopes derived from visible invoices. This is not claim submission, status workflow, or an X12 payload. Paged over the caller’s visible invoices: page (default 1) and pageSize (default 25, max 100). total counts only visible rows; invalid values return 400.',
	})
	@ApiOkResponse({type: ClaimListRdo})
	@ApiBadRequestResponse({type: ErrorEnvelopeRdo})
	list(@Query({schema: claimListQuerySchema}) query: ClaimListQuery): Promise<ClaimListRdo> {
		return this.billing.listClaims(query);
	}
}
