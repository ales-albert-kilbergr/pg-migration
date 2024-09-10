import { TestingDatabase } from '@kilbergr/pg-testing';
import { CreateMigrationTableQuery } from './create-migration-table.query';
import type { CreateMigrationTableArgs } from './create-migration-table.types';
import { stringRandom } from '@kilbergr/string';
import * as E from 'fp-ts/lib/Either';
import { SchemaExistsQuery, TableExistsQuery } from '@kilbergr/pg-datasource';

describe('(Integration) Create Migration Table query', () => {
  const testingDatabase = new TestingDatabase('CreateMigrationTableQuery');

  beforeAll(async () => {
    await testingDatabase.init();
  });

  afterAll(async () => {
    await testingDatabase.close();
  });

  it('should create a table if it does not exist', async () => {
    // Arrange
    const datasource = testingDatabase.getDataSource();
    const queryRunner = datasource.createQueryRunner();
    const args: CreateMigrationTableArgs = {
      schema: 'migration_repository_' + stringRandom(),
      table: 'migrations_' + stringRandom(),
    };
    // Act
    const result = await queryRunner
      .prepare(CreateMigrationTableQuery)
      .setArgs(args)
      .execute();
    const schemaExists = await queryRunner
      .prepare(SchemaExistsQuery)
      .setArgs({
        schema: args.schema,
      })
      .execute();

    const tableExists = await queryRunner
      .prepare(TableExistsQuery)
      .setArgs({
        schema: args.schema,
        table: args.table,
      })
      .execute();
    // Assert
    expect(E.isRight(result)).toBe(true);
    expect(E.isRight(schemaExists)).toBe(true);
    expect(E.isRight(tableExists)).toBe(true);

    if (
      E.isRight(result) &&
      E.isRight(schemaExists) &&
      E.isRight(tableExists)
    ) {
      expect(schemaExists.right).toBe(true);
      expect(tableExists.right).toBe(true);
    }
  });
});
