import {
  pickFirstRecord,
  mapToColumn,
  SqlStatement,
} from '@kilbergr/pg-datasource';
import { FindLatestSequenceNumber } from './find-latest-sequence-number.config';

export const FindLatestSequenceNumberStatement = SqlStatement.from(
  FindLatestSequenceNumber,
).processDataFlow(mapToColumn<number>('sequence_number'), pickFirstRecord());
