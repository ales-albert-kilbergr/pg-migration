import {
  SqlStatement,
  transformColumnKeysToCamelCase,
  transformRowToInstance,
} from '@kilbergr/pg-datasource';
import { FindManyMigrations } from '../../configs';
import { MigrationRecord } from '../../../migration-record';

export const FindManyMigrationsStatement = SqlStatement.from(
  FindManyMigrations,
).processResultFlow(
  transformColumnKeysToCamelCase(),
  transformRowToInstance(MigrationRecord),
);
