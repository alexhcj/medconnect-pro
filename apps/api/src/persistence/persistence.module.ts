import {Module} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';
import type {Env} from '../platform/env.schema.js';
import {postgresConnectionOptions} from './typeorm.options.js';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService<Env, true>) =>
				postgresConnectionOptions(config.get('DATABASE_URL', {infer: true})),
		}),
	],
	exports: [TypeOrmModule],
})
export class PersistenceModule {}
