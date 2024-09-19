import { Identifier, type QueryConfig, sql } from '@kilbergr/pg-sql';

export declare namespace FindOneMigration {
  export interface Args {
    schema: string;
    table: string;
    fileName: string;
  }
}

export function FindOneMigration(args: FindOneMigration.Args): QueryConfig {
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
