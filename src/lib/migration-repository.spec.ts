/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestingDatabase } from '@kilbergr/pg-testing';
import { MigrationRepository } from './migration-repository';
import { stringRandom } from '@kilbergr/string';
import { MigrationDirection } from './migration';
import { MigrationFileNameStub } from './migration-file-name.stub';
import { MigrationRecord } from './migration-record';

describe('(Integration) MigrationRepository', () => {
  const testingDatabase = new TestingDatabase('MigrationRepository');

  beforeAll(async () => {
    await testingDatabase.init();
  });

  afterAll(async () => {
    await testingDatabase.close();
  });

  describe('createTable()', () => {
    it('should create a table if it does not exist', async () => {
      // Arrange
      const datasource = testingDatabase.getDataSource();
      const queryRunner = datasource.createQueryRunner();
      const config: MigrationRepository.Config = {
        schema: 'migration_repository_' + stringRandom(),
        table: 'migrations_' + stringRandom(),
      };
      const migrationRepository = new MigrationRepository(queryRunner, config);
      // Act
      await migrationRepository.createTableIfNotExists();
      const schemaExists = await datasource.schemaExists(config.schema);
      const tableExists = await datasource.tableExists(
        config.schema,
        config.table,
      );
      // Assert
      expect(schemaExists).toBe(true);
      expect(tableExists).toBe(true);
    });
  });

  describe('insert', () => {
    it('should insert a record into the table', async () => {
      // Arrange
      const datasource = testingDatabase.getDataSource();
      const queryRunner = datasource.createQueryRunner();
      const config: MigrationRepository.Config = {
        schema: 'migration_repository_' + stringRandom(),
        table: 'migrations_' + stringRandom(),
      };
      const fileName = MigrationFileNameStub();
      const migrationRepository = new MigrationRepository(queryRunner, config);
      await migrationRepository.createTableIfNotExists();
      // Act
      await migrationRepository.insert([
        {
          sequenceNumber: 1,
          fileName: fileName,
          direction: MigrationDirection.UP,
          description: 'description',
          duration: 100,
        },
      ]);
      const record = await migrationRepository.findOne(fileName);
      // Assert
      expect(record).toBeInstanceOf(MigrationRecord);
      expect(record).toMatchObject({
        sequenceNumber: 1,
        fileName: fileName,
        direction: MigrationDirection.UP,
        description: 'description',
        duration: 100,
      });
    });
  });

  describe('findMany', () => {
    it('should find all records in the table', async () => {
      // Arrange
      const datasource = testingDatabase.getDataSource();
      const queryRunner = datasource.createQueryRunner();
      const config: MigrationRepository.Config = {
        schema: 'migration_repository_' + stringRandom(),
        table: 'migrations_' + stringRandom(),
      };
      const fileName = MigrationFileNameStub();
      const migrationRepository = new MigrationRepository(queryRunner, config);
      await migrationRepository.createTableIfNotExists();
      await migrationRepository.insert([
        {
          sequenceNumber: 1,
          fileName: fileName,
          direction: MigrationDirection.UP,
          description: 'description',
          duration: 100,
        },
      ]);
      // Act
      const records = await migrationRepository.findMany();
      // Assert
      expect(records).toBeInstanceOf(Array);
      expect(records).toHaveLength(1);
      expect(records[0]).toBeInstanceOf(MigrationRecord);
      expect(records[0]).toMatchObject({
        sequenceNumber: 1,
        fileName: fileName,
        direction: MigrationDirection.UP,
        description: 'description',
        duration: 100,
      });
    });
  });

  describe('findLatestSequenceNumber', () => {
    it('should find the latest sequence number in the table', async () => {
      // Arrange
      const datasource = testingDatabase.getDataSource();
      const queryRunner = datasource.createQueryRunner();
      const config: MigrationRepository.Config = {
        schema: 'migration_repository_' + stringRandom(),
        table: 'migrations_' + stringRandom(),
      };
      const migrationRepository = new MigrationRepository(queryRunner, config);
      await migrationRepository.createTableIfNotExists();
      await migrationRepository.insert([
        {
          sequenceNumber: 1,
          fileName: MigrationFileNameStub(),
          direction: MigrationDirection.UP,
          description: 'description',
          duration: 100,
        },
        {
          sequenceNumber: 2,
          fileName: MigrationFileNameStub(),
          direction: MigrationDirection.UP,
          description: 'description',
          duration: 100,
        },
      ]);
      // Act
      const sequenceNumber =
        await migrationRepository.findLatestSequenceNumber();
      // Assert
      expect(sequenceNumber).toBe(2);
    });

    it('should return 0 if the table is empty', async () => {
      // Arrange
      const datasource = testingDatabase.getDataSource();
      const queryRunner = datasource.createQueryRunner();
      const config: MigrationRepository.Config = {
        schema: 'migration_repository_' + stringRandom(),
        table: 'migrations_' + stringRandom(),
      };
      const migrationRepository = new MigrationRepository(queryRunner, config);
      await migrationRepository.createTableIfNotExists();
      // Act
      const sequenceNumber =
        await migrationRepository.findLatestSequenceNumber();
      // Assert
      expect(sequenceNumber).toBe(0);
    });
  });
});
