import {
  FindLatestSequenceNumberQuery,
  build,
} from './find-latest-sequence-number.query';
import type { FindLatestSequenceNumberArgs } from './find-latest-sequence-number.types';
import { mock } from 'jest-mock-extended';
import type { QueryRunner } from '@kilbergr/pg-datasource';
import * as E from 'fp-ts/lib/Either';
import { ValidationError } from 'joi';

describe('(Unit) FindLatestSequenceNumberQuery', () => {
  describe('validation before building', () => {
    it('return a ValidationError if the schema is missing', async () => {
      // Arrange
      // @ts-expect-error schema is missing for testing purposes
      const args: FindLatestSequenceNumberArgs = {
        table: 'table',
      };
      const queryRunner = mock<QueryRunner>();
      // Act
      const result = await FindLatestSequenceNumberQuery.prepare(queryRunner)
        .setArgs(args)
        .execute();
      // Assert
      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toContain('The schema is required.');
      }
    });

    it('return a ValidationError if the table is missing', async () => {
      // Arrange
      // @ts-expect-error table is missing for testing purposes
      const args: FindLatestSequenceNumberArgs = {
        schema: 'schema',
      };
      const queryRunner = mock<QueryRunner>();
      // Act
      const result = await FindLatestSequenceNumberQuery.prepare(queryRunner)
        .setArgs(args)
        .execute();
      // Assert
      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toContain('The table is required.');
      }
    });
  });

  describe('building', () => {
    it('should build the query', () => {
      // Arrange
      const args: FindLatestSequenceNumberArgs = {
        schema: 'schema',
        table: 'table',
      };
      // Act
      const query = build(args);
      // Assert
      expect(query).toMatchObject({
        text: 'SELECT MAX(sequence_number) AS sequence_number FROM "schema"."table"',
      });
    });
  });

  describe('execution', () => {
    it('should execute the query and return a number', async () => {
      // Arrange
      const args: FindLatestSequenceNumberArgs = {
        schema: 'schema',
        table: 'table',
      };
      const queryResult = mock<QueryRunner.Result>({
        rows: [{ sequence_number: 1 }],
      });
      const queryRunner = mock<QueryRunner>();
      queryRunner.query.mockResolvedValue(E.right(queryResult));
      // Act
      const result = await FindLatestSequenceNumberQuery.prepare(queryRunner)
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
      const args: FindLatestSequenceNumberArgs = {
        schema: 'schema',
        table: 'table',
      };
      const queryResult = mock<QueryRunner.Result>({
        rows: [],
      });
      const queryRunner = mock<QueryRunner>();
      queryRunner.query.mockResolvedValue(E.right(queryResult));
      // Act
      const result = await FindLatestSequenceNumberQuery.prepare(queryRunner)
        .setArgs(args)
        .execute();
      // Assert
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right).toBeUndefined();
      }
    });
  });
});
