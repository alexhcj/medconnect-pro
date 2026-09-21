import {Controller, Get} from '@nestjs/common';
import {
	ApiExtraModels,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {HealthRdo, ReadyRdo} from './health.rdo.js';

@ApiTags('platform')
@ApiExtraModels(ErrorEnvelopeRdo)
@Controller()
export class HealthController {
	@Get('health')
	@ApiOperation({summary: 'Liveness probe'})
	@ApiOkResponse({type: HealthRdo})
	@ApiInternalServerErrorResponse({type: ErrorEnvelopeRdo})
	liveness(): HealthRdo {
		return {status: 'ok'};
	}

	@Get('ready')
	@ApiOperation({
		summary: 'Readiness probe',
		description:
			'Returns ready when the process can serve HTTP. PostgreSQL and Redis checks arrive with DATA-001.',
	})
	@ApiOkResponse({type: ReadyRdo})
	@ApiInternalServerErrorResponse({type: ErrorEnvelopeRdo})
	readiness(): ReadyRdo {
		return {status: 'ready'};
	}
}
