import { Identifier, type QueryConfig, sql } from '@kilbergr/pg-sql';

export declare namespace CreateMigrationTable {
  export interface Args {
    schema: string;
    table: string;
  }
}

export function CreateMigrationTable(
  args: CreateMigrationTable.Args,
): QueryConfig {
  const pkName = `pk_${args.schema}_migration_log`;

  return sql`
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
}
