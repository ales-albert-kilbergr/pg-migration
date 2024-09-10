/* eslint-disable @typescript-eslint/init-declarations */
import { TestingDatabase } from '@kilbergr/pg-testing';
import { stringRandom } from '@kilbergr/string';
import { CreateMigrationTableQuery } from '../create-migration-table';
import * as E from 'fp-ts/lib/Either';
import { MigrationFileNameStub } from '../../migration-file-name.stub';
import { MigrationDirection } from '../../migration';
import { MigrationRecord } from '../../migration-record';
import { InsertMigrationQuery } from '../insert-migration';
import { FindOneQuery } from './find-one-migration.query';
import type { migrationFileName } from '../../migration-file-name';

describe('(Integration) Find one Migration query', () => {
  const testingDatabase = new TestingDatabase('InsertMigrationQuery');
  let schema: string;
  let table: string;
  let fileName: migrationFileName;

  beforeAll(async () => {
    await testingDatabase.init();
    schema = 'migration_repository_' + stringRandom();
    table = 'migrations_' + stringRandom();
    fileName = MigrationFileNameStub();

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
        migrations: [
          {
            sequenceNumber: 1,
            fileName: fileName,
            direction: MigrationDirection.UP,
            description: 'description',
            duration: 100,
          },
        ],
      })
      .execute();

    if (E.isLeft(insertResult)) {
      throw new Error('Failed to insert record');
    }
  });

  afterAll(async () => {
    await testingDatabase.close();
  });

  it('should find an existing migration record', async () => {
    // Arrange
    const datasource = testingDatabase.getDataSource();
    const queryRunner = datasource.createQueryRunner();

    // Act
    const record = await queryRunner
      .prepare(FindOneQuery)
      .setArgs({
        schema,
        table,
        fileName,
      })
      .execute();
    // Assert
    expect(E.isRight(record)).toBe(true);
    if (E.isRight(record)) {
      expect(record.right).toBeInstanceOf(MigrationRecord);
      expect(record.right).toMatchObject({
        sequenceNumber: 1,
        fileName: fileName,
        direction: MigrationDirection.UP,
        description: 'description',
        duration: 100,
      });
    }
  });

  it('should return undefined if record does not exist', async () => {
    // Arrange
    const datasource = testingDatabase.getDataSource();
    const queryRunner = datasource.createQueryRunner();
    const notExistingFileName = MigrationFileNameStub();

    // Act
    const record = await queryRunner
      .prepare(FindOneQuery)
      .setArgs({
        schema,
        table,
        fileName: notExistingFileName,
      })
      .execute();
    // Assert
    expect(E.isRight(record)).toBe(true);
    if (E.isRight(record)) {
      expect(record.right).toBeUndefined();
    }
  });
});
