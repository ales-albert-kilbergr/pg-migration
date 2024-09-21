import { mock } from 'jest-mock-extended';
import type { QueryRunner } from '@kilbergr/pg-datasource';
import * as E from 'fp-ts/lib/Either';
import type { FindLatestSequenceNumber } from './find-latest-sequence-number.config';
import { FindLatestSequenceNumberStatement } from './find-latest-sequence-number.statement';

describe('(Unit) FindLatestSequenceNumberStatement', () => {
  it('should execute the query and return a number', async () => {
    // Arrange
    const args: FindLatestSequenceNumber.Args = {
      schema: 'schema',
      table: 'table',
    };
    const queryResult = mock<QueryRunner.Result>({
      rows: [{ sequence_number: 1 }],
    });
    const queryRunner = mock<QueryRunner>();
    queryRunner.query.mockResolvedValue(E.right(queryResult));
    // Act
    const result = await FindLatestSequenceNumberStatement.prepare(queryRunner)
      .setArgs(args)
      .execute();
    // Assert
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right).toBe(1);
    }
  });

  it('should return undefined if the query returns no rows', async () => {
    // Arrange
    const args: FindLatestSequenceNumber.Args = {
      schema: 'schema',
      table: 'table',
    };
    const queryResult = mock<QueryRunner.Result>({
      rows: [],
    });
    const queryRunner = mock<QueryRunner>();
    queryRunner.query.mockResolvedValue(E.right(queryResult));
    // Act
    const result = await FindLatestSequenceNumberStatement.prepare(queryRunner)
      .setArgs(args)
      .execute();
    // Assert
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right).toBeUndefined();
    }
  });
});
