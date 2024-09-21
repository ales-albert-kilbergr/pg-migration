import {
  SqlStatement,
  transformColumnNamesToCamelCase,
  transformToInstance,
} from '@kilbergr/pg-datasource';
import { FindManyMigrations } from './find-many-migrations.config';
import { MigrationRecord } from '../../migration-record';

export const FindManyMigrationsStatement = SqlStatement.from(
  FindManyMigrations,
).processDataFlow(
  transformColumnNamesToCamelCase(),
  transformToInstance(MigrationRecord),
);
