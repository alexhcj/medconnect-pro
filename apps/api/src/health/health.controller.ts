import {Controller, Get, ServiceUnavailableException} from '@nestjs/common';
import {
	ApiExtraModels,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiOperation,
	ApiServiceUnavailableResponse,
	ApiTags,
} from '@nestjs/swagger';
import {DataSource} from 'typeorm';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {HealthRdo, ReadyRdo} from './health.rdo.js';

@ApiTags('platform')
@ApiExtraModels(ErrorEnvelopeRdo)
@Controller()
export class HealthController {
	constructor(private readonly dataSource: DataSource) {}

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
			'Returns ready when PostgreSQL accepts a connection. Liveness (/health) does not depend on the database.',
	})
	@ApiOkResponse({type: ReadyRdo})
	@ApiServiceUnavailableResponse({type: ErrorEnvelopeRdo})
	@ApiInternalServerErrorResponse({type: ErrorEnvelopeRdo})
	async readiness(): Promise<ReadyRdo> {
		try {
			await this.dataSource.query('SELECT 1');
			return {status: 'ready'};
		} catch {
			throw new ServiceUnavailableException({
				error: {
					code: 'SERVICE_UNAVAILABLE',
					message: 'Database is not ready',
				},
			});
		}
	}
}
