import {Module} from '@nestjs/common';
import {PersistenceModule} from '../persistence/persistence.module.js';
import {HealthController} from './health.controller.js';

@Module({
	imports: [PersistenceModule],
	controllers: [HealthController],
})
export class HealthModule {}
