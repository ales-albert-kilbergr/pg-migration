import { Migration, MigrationTypeError } from './migration';
import { MigrationComponentsStub } from './migration.stub';

describe('(Unit) PostgresMigration', () => {
  describe('create()', () => {
    it('should create a new instance of PostgresMigration', () => {
      // Arrange
      const migrationProps = MigrationComponentsStub();
      // Act
      const result = Migration.create(migrationProps);
      // Assert
      expect(result).toBeInstanceOf(Migration);
    });

    it('should assign props to the new instance', () => {
      // Arrange
      const migrationProps = MigrationComponentsStub();
      // Act
      const result = Migration.create(migrationProps);
      // Assert
      expect(result).toMatchObject(migrationProps);
    });

    it('should throw an error if props are not a valid PostgresMigration', () => {
      // Arrange
      const migrationProps = {};
      // Act & Assert
      expect(() => Migration.create(migrationProps)).toThrow(TypeError);
    });
  });

  describe('assert()', () => {
    it('should not throw an error if value is a valid PostgresMigration', () => {
      // Arrange
      const value = Migration.create(MigrationComponentsStub());
      // Act
      const act = (): void => {
        Migration.assert(value);
      };
      // Assert
      expect(act).not.toThrow();
    });

    it('should throw an error if value is not a valid PostgresMigration', () => {
      // Arrange
      const value = {};
      // Act
      const act = (): void => {
        Migration.assert(value);
      };
      // Act & Assert
      expect(act).toThrow(MigrationTypeError);
    });
  });

  describe('isMigration()', () => {
    it('should return true if value is a valid PostgresMigration', () => {
      // Arrange
      const value = Migration.create(MigrationComponentsStub());
      // Act
      const result = Migration.isMigration(value);
      // Assert
      expect(result).toBe(true);
    });

    it('should return false if value is not a valid PostgresMigration', () => {
      // Arrange
      const value = {};
      // Act
      const result = Migration.isMigration(value);
      // Assert
      expect(result).toBe(false);
    });
  });
});
