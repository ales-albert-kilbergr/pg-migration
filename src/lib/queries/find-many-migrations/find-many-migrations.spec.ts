/* eslint-disable @typescript-eslint/init-declarations */
import { TestingDatabase } from '@kilbergr/pg-testing';
import { stringRandom } from '@kilbergr/string';
import type { migrationFileName } from '../../migration-file-name';
import { MigrationFileNameStub } from '../../migration-file-name.stub';
import { CreateMigrationTableQuery } from '../create-migration-table';
import * as E from 'fp-ts/lib/Either';
import { MigrationDirection } from '../../migration';
import { InsertMigrationQuery } from '../insert-migration';
import { FindManyMigrationsQuery } from './find-many-migrations.query';

describe('(Integration) Find many Migrations query', () => {
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
      .prepare(CreateMigrationTableQuery)
      .setArgs({ schema, table })
      .execute();

    if (E.isLeft(result)) {
      throw new Error('Failed to create table');
    }

    const insertResult = await queryRunner
      .prepare(InsertMigrationQuery)
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
      .prepare(FindManyMigrationsQuery)
      .setArgs({ schema, table })
      .execute();
    // Assert
    expect(E.isRight(result)).toBe(true);

    if (E.isRight(result)) {
      expect(result.right).toHaveLength(fileNames.length);
    }
  });
});
