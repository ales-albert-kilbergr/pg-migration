import { Identifier, sql, type QueryConfig } from '@kilbergr/pg-sql';
import type { FindOneArgs } from './find-one-migration.types';
import {
  pickFirstRecord,
  processResultFlow,
  SqlStatement,
  transformColumnKeysToCamelCase,
  transformRowToInstance,
} from '@kilbergr/pg-datasource';
import { MigrationRecord } from '../../migration-record';

export function build(args: FindOneArgs): QueryConfig {
  return sql`
    SELECT sequence_number,
      file_name,
      direction,
      description,
      duration,
      created_at
    FROM ${Identifier(`${args.schema}.${args.table}`)}
    WHERE file_name = :${args.fileName}
    ORDER BY sequence_number ASC
  `;
}

export const FindOneQuery = SqlStatement.create({
  build,
  processResult: processResultFlow(
    transformColumnKeysToCamelCase(),
    transformRowToInstance(MigrationRecord),
    pickFirstRecord(),
  ),
});
