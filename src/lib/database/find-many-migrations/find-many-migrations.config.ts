import { Identifier, type QueryConfig, sql } from '@kilbergr/pg-sql';

export declare namespace FindManyMigrations {
  export interface Args {
    schema: string;
    table: string;
  }
}

export function FindManyMigrations(args: FindManyMigrations.Args): QueryConfig {
  return sql`
    SELECT *
    FROM ${Identifier(`${args.schema}.${args.table}`)}
    ORDER BY sequence_number ASC
  `;
}
