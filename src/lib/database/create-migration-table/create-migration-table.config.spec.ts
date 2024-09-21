import { CreateMigrationTable } from './create-migration-table.config';

describe('(Unit) CreateMigrationTable query config', () => {
  it('should build a correct query config', () => {
    // Arrange
    const args: CreateMigrationTable.Args = {
      schema: 'schema',
      table: 'table',
    };
    // Act
    const query = CreateMigrationTable(args);
    // Assert
    expect(query).toMatchObject({
      text:
        'CREATE SCHEMA IF NOT EXISTS "schema"; ' +
        'CREATE TABLE IF NOT EXISTS "schema"."table" (' +
        'sequence_number INT NOT NULL, ' +
        'file_name TEXT NOT NULL, ' +
        'direction TEXT NOT NULL, ' +
        'description TEXT, ' +
        'duration INT DEFAULT 0, ' +
        'created_at TIMESTAMPTZ DEFAULT NOW(), ' +
        'CONSTRAINT "pk_schema_migration_log" PRIMARY KEY (sequence_number));',
    });
  });
});
