import {
  InsertColumns,
  InsertInto,
  InsertValues,
  sql,
  type QueryConfig,
} from '@kilbergr/pg-sql';
import type { InsertMigrationArgs } from './insert-migration.types';
import { toSnakeCase } from '@kilbergr/string';
import {
  processResultFlow,
  reduceToVoid,
  SqlStatement,
} from '@kilbergr/pg-datasource';

export function build(args: InsertMigrationArgs): QueryConfig {
  const columns = Object.keys(args.migrations[0]);

  const queryConfig = sql`
    ${InsertInto(`${args.schema}.${args.table}`)}
    ${InsertColumns(columns, { transformKey: toSnakeCase })}
    ${InsertValues(args.migrations, { columns })}
  `;

  return queryConfig;
}

export const InsertMigrationQuery = SqlStatement.create({
  build,
  processResult: processResultFlow(reduceToVoid()),
});
