import { SqlStatement } from '@kilbergr/pg-datasource';
import { InsertMigration } from './insert-migration.config';

export const InsertMigrationStatement =
  SqlStatement.from(InsertMigration).processResultToVoid();
