import {Module} from '@nestjs/common';
import {TenantContext} from './tenant-context.js';

@Module({
	providers: [TenantContext],
	exports: [TenantContext],
})
export class TenancyModule {}
