import {DataSource} from 'typeorm';
import {resolveAdminDatabaseUrl} from './default-database-url.js';
import {postgresConnectionOptions} from './typeorm.options.js';

export default new DataSource(postgresConnectionOptions(resolveAdminDatabaseUrl()));
