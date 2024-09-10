/* eslint-disable @typescript-eslint/init-declarations */
import { TestingDatabase } from '@kilbergr/pg-testing';
import { stringRandom } from '@kilbergr/string';
import { CreateMigrationTableQuery } from '../create-migration-table';
import * as E from 'fp-ts/lib/Either';
import { MigrationFileNameStub } from '../../migration-file-name.stub';
import { InsertMigrationQuery } from './insert-migration.query';
import { MigrationDirection } from '../../migration';
import { FindOneQuery } from '../find-one-migration';
import { MigrationRecord } from '../../migration-record';

describe('(Integration) Insert Migration query', () => {
  const testingDatabase = new TestingDatabase('InsertMigrationQuery');
  let schema: string;
  let table: string;

  beforeAll(async () => {
    await testingDatabase.init();
    schema = 'migration_repository_' + stringRandom();
    table = 'migrations_' + stringRandom();

    const datasource = testingDatabase.getDataSource();
    const queryRunner = datasource.createQueryRunner();

    const result = await queryRunner
      .prepare(CreateMigrationTableQuery)
      .setArgs({ schema, table })
      .execute();

    if (E.isLeft(result)) {
      throw new Error('Failed to create table');
    }
  });

  afterAll(async () => {
    await testingDatabase.close();
  });

  it('should insert a record into the table', async () => {
    // Arrange
    const datasource = testingDatabase.getDataSource();
    const queryRunner = datasource.createQueryRunner();
    const fileName = MigrationFileNameStub();

    // Act
    await queryRunner
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
    const fileName = MigrationFileNameStub();

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
      expect(record.right).toBeUndefined();
    }
  });
});
