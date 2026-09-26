import {Controller, Get} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {ClaimListRdo} from './billing.rdo.js';
import {BillingService} from './billing.service.js';

@ApiTags('billing')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('billing/claims')
export class ClaimsController {
	constructor(private readonly billing: BillingService) {}

	@Get()
	@ApiOperation({
		summary: 'List claim envelopes for visible invoices',
		description:
			'Labeled EDI 837 boundary. Returns not_submitted envelopes derived from visible invoices. This is not claim submission, status workflow, or an X12 payload.',
	})
	@ApiOkResponse({type: ClaimListRdo})
	list(): Promise<ClaimListRdo> {
		return this.billing.listClaims();
	}
}
