import { mock } from 'jest-mock-extended';
import { MigrationLogger } from './migration-logger';
import { MigrationStub } from './migration.stub';

describe('(Unit) MigrationLogger', () => {
  describe('logMigrationSucceeded', () => {
    it('should log a successful migration', () => {
      // Arrange
      const driver = mock<MigrationLogger.Driver>();
      const migration = MigrationStub();
      const logger = new MigrationLogger(driver);
      // Act
      logger.logMigrationSucceeded(migration);
      // Assert
      expect(driver.log).toHaveBeenCalledWith(
        `Migration ${migration.title} successful`,
        {
          pg: {
            type: MigrationLogger.MESSAGE_TYPES.MIGRATION_SUCCESS,
            title: migration.title,
            duration: migration.duration,
            description: migration.description,
            fileName: migration.fileName,
          },
        },
      );
    });
  });

  describe('logMigrationSkipped', () => {
    it('should log a skipped migration', () => {
      // Arrange
      const driver = mock<MigrationLogger.Driver>();
      const migration = MigrationStub();
      const reason = 'reason';
      const logger = new MigrationLogger(driver);
      // Act
      logger.logMigrationSkipped(migration, reason);
      // Assert
      expect(driver.log).toHaveBeenCalledWith(
        `Migration ${migration.title} skipped: ${reason}`,
        {
          pg: {
            type: MigrationLogger.MESSAGE_TYPES.MIGRATION_SKIPPED,
            title: migration.title,
            fileName: migration.fileName,
            reason,
          },
        },
      );
    });
  });

  describe('logMigrationFailed', () => {
    it('should log a failed migration with normal error', () => {
      // Arrange
      const driver = mock<MigrationLogger.Driver>();
      const migration = MigrationStub();
      const error = new Error('error');
      const logger = new MigrationLogger(driver);
      // Act
      logger.logMigrationFailed(migration, error);
      // Assert
      expect(driver.error).toHaveBeenCalledWith(
        `Migration ${migration.title} failed. error`,
        {
          pg: {
            type: MigrationLogger.MESSAGE_TYPES.MIGRATION_FAILED,
            title: migration.title,
            fileName: migration.fileName,
            error: error.message,
          },
        },
      );
    });

    it('should log a failed migration with an aggregate error and custom message.', () => {
      // Arrange
      const driver = mock<MigrationLogger.Driver>();
      const migration = MigrationStub();
      const error = new AggregateError([new Error('error')], 'custom message');
      const logger = new MigrationLogger(driver);
      // Act
      logger.logMigrationFailed(migration, error);
      // Assert
      expect(driver.error).toHaveBeenCalledWith(
        `Migration ${migration.title} failed. custom message, error`,
        {
          pg: {
            type: MigrationLogger.MESSAGE_TYPES.MIGRATION_FAILED,
            title: migration.title,
            fileName: migration.fileName,
            error: 'custom message, error',
          },
        },
      );
    });

    it('should log a failed migration with an aggregate error and multiple errors', () => {
      // Arrange
      const driver = mock<MigrationLogger.Driver>();
      const migration = MigrationStub();
      const error = new AggregateError([
        new Error('error1'),
        new Error('error2'),
      ]);
      const logger = new MigrationLogger(driver);
      // Act
      logger.logMigrationFailed(migration, error);
      // Assert
      expect(driver.error).toHaveBeenCalledWith(
        `Migration ${migration.title} failed. error1, error2`,
        {
          pg: {
            type: MigrationLogger.MESSAGE_TYPES.MIGRATION_FAILED,
            title: migration.title,
            fileName: migration.fileName,
            error: 'error1, error2',
          },
        },
      );
    });

    it('should log a failed migration with an unknown error', () => {
      // Arrange
      const driver = mock<MigrationLogger.Driver>();
      const migration = MigrationStub();
      const error = 'error';
      const logger = new MigrationLogger(driver);
      // Act
      logger.logMigrationFailed(migration, error);
      // Assert
      expect(driver.error).toHaveBeenCalledWith(
        `Migration ${migration.title} failed. error`,
        {
          pg: {
            type: MigrationLogger.MESSAGE_TYPES.MIGRATION_FAILED,
            title: migration.title,
            fileName: migration.fileName,
            error,
          },
        },
      );
    });

    it('should log a failed migration with an unknown error', () => {
      // Arrange
      const driver = mock<MigrationLogger.Driver>();
      const migration = MigrationStub();
      const error = 'error';
      const logger = new MigrationLogger(driver);
      // Act
      logger.logMigrationFailed(migration, error);
      // Assert
      expect(driver.error).toHaveBeenCalledWith(
        `Migration ${migration.title} failed. error`,
        {
          pg: {
            type: MigrationLogger.MESSAGE_TYPES.MIGRATION_FAILED,
            title: migration.title,
            fileName: migration.fileName,
            error,
          },
        },
      );
    });
  });
});
