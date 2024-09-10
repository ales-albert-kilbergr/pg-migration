import {
  pickFirstRecord,
  processResultFlow,
  reduceToColumn,
  SqlStatement,
} from '@kilbergr/pg-datasource';
import type { FindLatestSequenceNumberArgs } from './find-latest-sequence-number.types';
import { Identifier, type QueryConfig, sql } from '@kilbergr/pg-sql';
import * as Joi from 'joi';

export function build(args: FindLatestSequenceNumberArgs): QueryConfig {
  return sql`
    SELECT MAX(sequence_number) AS sequence_number
    FROM ${Identifier(`${args.schema}.${args.table}`)}
  `;
}

const ERROR_MESSAGE_PREFIX = `Failed to find the latest sequence number.`;

const argsSchema = Joi.object<FindLatestSequenceNumberArgs>({
  schema: Joi.string()
    .required()
    .messages({
      'any.required': `${ERROR_MESSAGE_PREFIX} The schema is required.`,
    }),
  table: Joi.string()
    .required()
    .messages({
      'any.required': `${ERROR_MESSAGE_PREFIX} The table is required.`,
    }),
});

export const FindLatestSequenceNumberQuery = SqlStatement.create({
  argsSchema,
  build,
  processResult: processResultFlow(
    reduceToColumn<number>('sequence_number'),
    pickFirstRecord(),
  ),
});
