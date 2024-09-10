import type { CreateMigrationTableArgs } from './create-migration-table.types';
import { type QueryConfig, Identifier, sql } from '@kilbergr/pg-sql';
import {
  SqlStatement,
  processResultFlow,
  reduceToVoid,
} from '@kilbergr/pg-datasource';

export function build(args: CreateMigrationTableArgs): QueryConfig {
  const pkName = `pk_${args.schema}_migration_log`;

  const queryConfig = sql`
    CREATE SCHEMA IF NOT EXISTS ${Identifier(args.schema)};

    CREATE TABLE IF NOT EXISTS ${Identifier(`${args.schema}.${args.table}`)} (
      sequence_number   INT NOT NULL,
      file_name         TEXT NOT NULL,
      direction         TEXT NOT NULL,
      description       TEXT,
      duration          INT DEFAULT 0,
      created_at        TIMESTAMPTZ DEFAULT NOW(),

      CONSTRAINT ${Identifier(pkName)} PRIMARY KEY (sequence_number)
    );
  `;

  return queryConfig;
}

export const CreateMigrationTableQuery = SqlStatement.create({
  build,
  processResult: processResultFlow(reduceToVoid()),
});
