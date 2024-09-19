import {
  pickFirstRecord,
  reduceToColumn,
  SqlStatement,
} from '@kilbergr/pg-datasource';
import { FindLatestSequenceNumber } from '../../configs';

export const FindLatestSequenceNumberStatement = SqlStatement.from(
  FindLatestSequenceNumber,
).processResultFlow(
  reduceToColumn<number>('sequence_number'),
  pickFirstRecord(),
);
