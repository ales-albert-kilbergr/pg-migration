import { SqlStatement } from '@kilbergr/pg-datasource';
import { CreateMigrationTable } from '../../configs';

export const CreateMigrationTableStatement =
  SqlStatement.from(CreateMigrationTable).processResultToVoid();
