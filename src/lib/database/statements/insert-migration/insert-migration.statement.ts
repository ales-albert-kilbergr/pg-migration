import { SqlStatement } from '@kilbergr/pg-datasource';
import { InsertMigration } from '../../configs';

export const InsertMigrationStatement =
  SqlStatement.from(InsertMigration).processResultToVoid();
