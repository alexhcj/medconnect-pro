import {Controller, Get} from '@nestjs/common';

@Controller()
export class HealthController {
	@Get('health')
	liveness(): {status: 'ok'} {
		return {status: 'ok'};
	}

	@Get('ready')
	readiness(): {status: 'ready'} {
		// DATA-001 will add PostgreSQL (and later Redis) checks. Until then the process is ready
		// when it can serve HTTP.
		return {status: 'ready'};
	}
}
