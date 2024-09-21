import { TestingDatabase } from '@kilbergr/pg-testing';
import { stringRandom } from '@kilbergr/string';
import * as E from 'fp-ts/lib/Either';
import {
  SchemaExistsStatement,
  TableExistsStatement,
} from '@kilbergr/pg-datasource';
import type { CreateMigrationTable } from './create-migration-table.config';
import { CreateMigrationTableStatement } from './create-migration-table.statement';

describe('(Integration) Create Migration Table query', () => {
  const testingDatabase = new TestingDatabase('CreateMigrationTableStatement');

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
    const args: CreateMigrationTable.Args = {
      schema: 'migration_repository_' + stringRandom(),
      table: 'migrations_' + stringRandom(),
    };
    // Act
    const result = await queryRunner
      .prepare(CreateMigrationTableStatement)
      .setArgs(args)
      .execute();
    const schemaExists = await queryRunner
      .prepare(SchemaExistsStatement)
      .setArgs({
        schema: args.schema,
      })
      .execute();

    const tableExists = await queryRunner
      .prepare(TableExistsStatement)
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
