import { Identifier, sql, type QueryConfig } from '@kilbergr/pg-sql';
import type { FindManyMigrationsArgs } from './find-many-migrations.types';
import {
  processResultFlow,
  SqlStatement,
  transformColumnKeysToCamelCase,
  transformRowToInstance,
} from '@kilbergr/pg-datasource';
import { MigrationRecord } from '../../migration-record';

export function build(args: FindManyMigrationsArgs): QueryConfig {
  return sql`
    SELECT sequence_number,
      file_name,
      direction,
      description,
      duration,
      created_at
    FROM ${Identifier(`${args.schema}.${args.table}`)}
    ORDER BY sequence_number ASC
  `;
}

export const FindManyMigrationsQuery = SqlStatement.create({
  build,
  processResult: processResultFlow(
    transformColumnKeysToCamelCase(),
    transformRowToInstance(MigrationRecord),
  ),
});
