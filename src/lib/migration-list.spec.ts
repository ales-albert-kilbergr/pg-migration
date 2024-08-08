/* eslint-disable @typescript-eslint/no-magic-numbers */
import { MigrationTypeError } from './migration';
import { MigrationList } from './migration-list';
import { MigrationStub } from './migration.stub';

describe('(Unit) MigrationList', () => {
  describe('add', () => {
    it('should add a migration to the list', () => {
      // Arrange
      const migrationList = new MigrationList();
      const migration = MigrationStub();
      // Act
      migrationList.add(migration);
      // Assert
      expect(migrationList.size).toBe(1);
    });

    it('should throw an error if migration is not a valid PostgresMigration', () => {
      // Arrange
      const migrationList = new MigrationList();
      const migration = {};
      // Act & Assert
      expect(() => migrationList.add(migration)).toThrow(MigrationTypeError);
    });

    it('should throw an error if migration sequence number is already in the list', () => {
      // Arrange
      const migrationList = new MigrationList();
      const migration = MigrationStub({ sequenceNumber: 1 });
      migrationList.add(migration);
      // Act & Assert
      expect(() => migrationList.add(migration)).toThrow(MigrationTypeError);
    });

    it('should throw an error if migration sequence number is not a number', () => {
      // Arrange
      const migrationList = new MigrationList();
      // @ts-expect-error - Allow invalid sequence number for test.
      const migration = MigrationStub({ sequenceNumber: 'invalid' });
      // Act & Assert
      expect(() => migrationList.add(migration)).toThrow(MigrationTypeError);
    });

    it('should add multiple migrations to the list', () => {
      // Arrange
      const migrationList = new MigrationList();
      const migration1 = MigrationStub({ sequenceNumber: 1 });
      const migration2 = MigrationStub({ sequenceNumber: 2 });
      // Act
      migrationList.add(migration1);
      migrationList.add(migration2);
      // Assert
      expect(migrationList.size).toBe(2);
    });
  });

  describe('at', () => {
    it('should return a migration at given index', () => {
      // Arrange
      const migrationList = new MigrationList();
      const migration1 = MigrationStub({ sequenceNumber: 1 });
      const migration2 = MigrationStub({ sequenceNumber: 2 });
      migrationList.add(migration1);
      migrationList.add(migration2);
      // Act
      const result = migrationList.at(1);
      // Assert
      expect(result).toBe(migration2);
    });

    it('should return undefined if index is out of bounds', () => {
      // Arrange
      const migrationList = new MigrationList();
      // Act
      const result = migrationList.at(2);
      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('get', () => {
    it('should return a migration with given sequence number', () => {
      // Arrange
      const migrationList = new MigrationList();
      const migration1 = MigrationStub({ sequenceNumber: 1 });
      const migration2 = MigrationStub({ sequenceNumber: 2 });
      migrationList.add(migration1);
      migrationList.add(migration2);
      // Act
      const result = migrationList.get(1);
      // Assert
      expect(result).toBe(migration1);
    });

    it('should return undefined if sequence number is not in the list', () => {
      // Arrange
      const migrationList = new MigrationList();
      // Act
      const result = migrationList.get(1);
      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('toArray', () => {
    it('should return an array of migrations', () => {
      // Arrange
      const migrationList = new MigrationList();
      const migration1 = MigrationStub({ sequenceNumber: 1 });
      const migration2 = MigrationStub({ sequenceNumber: 2 });
      migrationList.add(migration1);
      migrationList.add(migration2);
      // Act
      const result = migrationList.toArray();
      // Assert
      expect(result).toEqual([migration1, migration2]);
    });
  });

  describe('size', () => {
    it('should return the number of migrations in the list', () => {
      // Arrange
      const migrationList = new MigrationList();
      const migration1 = MigrationStub({ sequenceNumber: 1 });
      const migration2 = MigrationStub({ sequenceNumber: 2 });
      migrationList.add(migration1);
      migrationList.add(migration2);
      // Act
      const result = migrationList.size;
      // Assert
      expect(result).toBe(2);
    });
  });
});
