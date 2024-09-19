import { Identifier, type QueryConfig, sql } from '@kilbergr/pg-sql';

export declare namespace FindLatestSequenceNumber {
  export interface Args {
    schema: string;
    table: string;
  }
}

export function FindLatestSequenceNumber(
  args: FindLatestSequenceNumber.Args,
): QueryConfig {
  return sql`
    SELECT MAX(sequence_number) AS sequence_number
    FROM ${Identifier(`${args.schema}.${args.table}`)}
`;
}
