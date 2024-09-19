import {
  InsertColumns,
  InsertInto,
  InsertValues,
  type QueryConfig,
  sql,
} from '@kilbergr/pg-sql';
import type { SetOptional } from 'type-fest';
import type { MigrationRecord } from '../../../migration-record';
import { toSnakeCase } from '@kilbergr/string';

export declare namespace InsertMigration {
  export interface Args {
    schema: string;
    table: string;
    migrations: SetOptional<MigrationRecord, 'createdAt'>[];
  }
}

export function InsertMigration(args: InsertMigration.Args): QueryConfig {
  const columns = Object.keys(args.migrations[0]);

  const queryConfig = sql`
    ${InsertInto(`${args.schema}.${args.table}`)}
    ${InsertColumns(columns, { transformKey: toSnakeCase })}
    ${InsertValues(args.migrations, { columns })}
  `;

  return queryConfig;
}
