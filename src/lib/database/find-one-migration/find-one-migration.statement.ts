import {
  pickFirstRecord,
  SqlStatement,
  transformColumnNamesToCamelCase,
  transformToInstance,
} from '@kilbergr/pg-datasource';
import { FindOneMigration } from './find-one-migration.config';
import { MigrationRecord } from '../../migration-record';

export const FindOneMigrationStatement = SqlStatement.from(
  FindOneMigration,
).processDataFlow(
  transformColumnNamesToCamelCase(),
  transformToInstance(MigrationRecord),
  pickFirstRecord(),
);
