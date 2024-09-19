import {
  pickFirstRecord,
  SqlStatement,
  transformColumnKeysToCamelCase,
  transformRowToInstance,
} from '@kilbergr/pg-datasource';
import { FindOneMigration } from '../../configs';
import { MigrationRecord } from '../../../migration-record';

export const FindOneMigrationStatement = SqlStatement.from(
  FindOneMigration,
).processResultFlow(
  transformColumnKeysToCamelCase(),
  transformRowToInstance(MigrationRecord),
  pickFirstRecord(),
);
