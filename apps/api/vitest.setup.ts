import 'reflect-metadata';
import {DEFAULT_DATABASE_URL} from './src/persistence/default-database-url.js';

process.env.DATABASE_URL ??= DEFAULT_DATABASE_URL;
