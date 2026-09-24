import {Controller, Get, Param, Query} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {ProviderAvailabilityRdo} from './appointment.rdo.js';
import {
	availabilityQuerySchema,
	providerIdParamsSchema,
	type AvailabilityQuery,
	type ProviderIdParams,
} from './appointment.schema.js';
import {AppointmentService} from './appointment.service.js';

@ApiTags('providers')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('providers')
export class AvailabilityController {
	constructor(private readonly appointments: AppointmentService) {}

	@Get(':id/availability')
	@ApiOperation({
		summary: 'Read provider availability in a time window',
		description:
			'Demo working hours are Monday–Friday 09:00–17:00 UTC. Busy intervals are non-cancelled appointments. Free intervals are working hours minus busy time. Unknown or cross-tenant providers return not-found. Window is limited to 31 days.',
	})
	@ApiOkResponse({type: ProviderAvailabilityRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	availability(
		@Param({schema: providerIdParamsSchema}) params: ProviderIdParams,
		@Query({schema: availabilityQuerySchema}) query: AvailabilityQuery,
	): Promise<ProviderAvailabilityRdo> {
		return this.appointments.availability(params.id, query);
	}
}
