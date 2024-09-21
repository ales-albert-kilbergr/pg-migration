import { SqlStatement } from '@kilbergr/pg-datasource';
import { CreateMigrationTable } from './create-migration-table.config';

export const CreateMigrationTableStatement =
  SqlStatement.from(CreateMigrationTable).processResultToVoid();
