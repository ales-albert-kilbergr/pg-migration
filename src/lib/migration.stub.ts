import { Migration } from './migration';
import { MigrationFileName } from './migration-file-name';
import { MigrationFileNameStub } from './migration-file-name.stub';

export function MigrationComponentsStub(
  propsStubOverride: Partial<Migration> = {},
): Migration {
  const migrationFileComponents = MigrationFileName.parse(
    MigrationFileNameStub(),
  );

  return {
    ...migrationFileComponents,
    up: async () => Promise.resolve(),
    down: async () => Promise.resolve(),
    ...propsStubOverride,
  };
}

/**
 * The PostgresMigrationMock function creates a mock of the
 * PostgresMigrationClass. It allows to override the metadata props or to insert
 * a mock for the up and down methods to simulate a behavior if migration
 * acts weirdly, timeouts or fails.
 */
export function MigrationStub({
  up,
  down,
  ...propsStubOverride
}: Partial<Migration> = {}): Migration {
  const migration: Migration = MigrationComponentsStub(propsStubOverride);

  if (up) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore override a method for testing purposes
    migration.up = up;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (up !== null) {
    // Assign default method if not explicitly set to null
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore override a method for testing purposes
    migration.up = async (): Promise<void> => Promise.resolve();
  }

  if (down) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore override a method for testing purposes
    migration.down = down;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (down !== null) {
    // Assign default method if not explicitly set to null
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore override a method for testing purposes
    migration.down = async (): Promise<void> => Promise.resolve();
  }

  return Migration.create(migration);
}

export function FailingMigrationStub(
  override: Partial<Omit<Migration, 'up' | 'down'>> = {},
): Migration {
  return MigrationStub({
    up: async () => Promise.reject(new Error('FailingMigrationStub')),
    down: async () => Promise.reject(new Error('FailingMigrationStub')),
    ...override,
  });
}
