import {DataSource} from 'typeorm';
import {DEFAULT_DATABASE_URL} from './default-database-url.js';
import {postgresConnectionOptions} from './typeorm.options.js';

const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

export default new DataSource(postgresConnectionOptions(databaseUrl));
