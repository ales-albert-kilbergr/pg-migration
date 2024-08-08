/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  MigrationFileName,
  type MigrationFileNameComponents,
} from './migration-file-name';
import { MigrationFileNameStub } from './migration-file-name.stub';

describe('(Unit) PostgresMigrationFileName', () => {
  describe('PostgresMigrationFileName() - cast', () => {
    it('should cast string to postgresMigrationFileName', () => {
      // Arrange
      const value = MigrationFileNameStub();
      // Act
      const result = MigrationFileName(value);
      // Assert
      expect(result).toBe(value);
    });

    it('should throw TypeError if value is not a string', () => {
      // Arrange
      const value = {};
      // Act & Assert
      expect(() => MigrationFileName(value)).toThrow(
        MigrationFileName.TypeError,
      );
    });

    it('should throw TypeError if value is not a valid postgresMigrationFileName', () => {
      // Arrange
      const value = 'invalid';
      // Act & Assert
      expect(() => MigrationFileName(value)).toThrow(
        MigrationFileName.TypeError,
      );
    });
  });

  describe('isTypeof', () => {
    it('should return true if value is a valid postgresMigrationFileName', () => {
      // Arrange
      const value = MigrationFileNameStub();
      // Act
      const result = MigrationFileName.isTypeof(value);
      // Assert
      expect(result).toBe(true);
    });

    it('should return false if value is not a string', () => {
      // Arrange
      const value = {};
      // Act
      const result = MigrationFileName.isTypeof(value);
      // Assert
      expect(result).toBe(false);
    });

    it('should return false if value is not a valid postgresMigrationFileName', () => {
      // Arrange
      const value = 'invalid';
      // Act
      const result = MigrationFileName.isTypeof(value);
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('assert', () => {
    it('should throw TypeError if value is not a valid postgresMigrationFileName', () => {
      // Arrange
      const value = 'invalid';
      // Act
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      const act = (): void => MigrationFileName.assert(value);
      // Assert
      expect(act).toThrow(MigrationFileName.TypeError);
    });

    it('should not throw TypeError if value is a valid postgresMigrationFileName', () => {
      // Arrange
      const value = MigrationFileNameStub();
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      const act = (): void => MigrationFileName.assert(value);
      // Assert
      expect(act).not.toThrow(MigrationFileName.TypeError);
    });
  });

  describe('parse', () => {
    it('should parse postgresMigrationFileName', () => {
      // Arrange
      const sequenceNumber = Date.now();
      const title = 'migration-test-file';
      const value = MigrationFileNameStub({
        sequenceNumber,
        title,
      });
      // Act
      const result = MigrationFileName.parse(value);
      // Assert
      expect(result).toEqual({
        fileName: value,
        sequenceNumber,
        title,
      });
    });

    it('should throw TypeError if value is not a valid postgresMigrationFileName', () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value: any = 'invalid';
      // Act & Assert
      const act = (): MigrationFileNameComponents =>
        MigrationFileName.parse(value);
      expect(act).toThrow(MigrationFileName.TypeError);
    });

    it('should parse a file name without title', () => {
      // Arrange
      const sequenceNumber = Date.now();
      const value = MigrationFileNameStub({
        sequenceNumber,
        title: '',
      });
      // Act
      const result = MigrationFileName.parse(value);
      // Assert
      expect(result).toEqual({
        fileName: value,
        sequenceNumber,
        title: '',
      });
    });
  });
});
