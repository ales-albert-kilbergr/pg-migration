/* eslint-disable @typescript-eslint/init-declarations */
import { TestingDatabase } from '@kilbergr/pg-testing';
import type { migrationFileName } from '../../migration-file-name';
import { stringRandom } from '@kilbergr/string';
import { MigrationFileNameStub } from '../../migration-file-name.stub';
import { CreateMigrationTableStatement } from '../create-migration-table/create-migration-table.statement';
import * as E from 'fp-ts/lib/Either';
import { InsertMigrationStatement } from '../insert-migration';
import { MigrationDirection } from '../../migration';
import { FindManyMigrationsStatement } from './find-many-migrations.statement';

describe('(Integration) Find Many Migrations statement', () => {
  const testingDatabase = new TestingDatabase('FindManyMigrationsQuery');
  let schema: string;
  let table: string;
  let fileNames: migrationFileName[];

  beforeAll(async () => {
    await testingDatabase.init();
    schema = 'migration_repository_' + stringRandom();
    table = 'migrations_' + stringRandom();
    fileNames = [
      MigrationFileNameStub(),
      MigrationFileNameStub(),
      MigrationFileNameStub(),
    ];

    const datasource = testingDatabase.getDataSource();
    const queryRunner = datasource.createQueryRunner();

    const result = await queryRunner
      .prepare(CreateMigrationTableStatement)
      .setArgs({ schema, table })
      .execute();

    if (E.isLeft(result)) {
      throw new Error('Failed to create table');
    }

    const insertResult = await queryRunner
      .prepare(InsertMigrationStatement)
      .setArgs({
        schema,
        table,
        migrations: fileNames.map((fileName, index) => ({
          sequenceNumber: index + 1,
          fileName,
          direction: MigrationDirection.UP,
          description: 'description',
          duration: 100,
        })),
      })
      .execute();

    if (E.isLeft(insertResult)) {
      throw new Error('Failed to insert record');
    }
  });

  afterAll(async () => {
    await testingDatabase.close();
  });

  it('should find all existing migration records', async () => {
    // Arrange
    const datasource = testingDatabase.getDataSource();
    const queryRunner = datasource.createQueryRunner();
    const result = await queryRunner
      .prepare(FindManyMigrationsStatement)
      .setArgs({ schema, table })
      .execute();
    // Assert
    expect(E.isRight(result)).toBe(true);

    if (E.isRight(result)) {
      expect(result.right).toHaveLength(fileNames.length);
    }
  });
});
