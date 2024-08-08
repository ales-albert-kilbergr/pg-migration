import type { Migration } from './migration';

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace MigrationLogger {
  export interface Driver {
    log: (message: string, messagePayload: Record<string, unknown>) => void;
    error: (message: string, messagePayload: Record<string, unknown>) => void;
  }
}

export class MigrationLogger {
  public static readonly MESSAGE_TYPES = {
    MIGRATION_SUCCESS: 'pg:MigrationSucceeded',
    MIGRATION_SKIPPED: 'pg:MigrationSkipped',
    MIGRATION_FAILED: 'pg:MigrationFailed',
  } as const;

  private readonly driver: MigrationLogger.Driver;

  public constructor(driver: MigrationLogger.Driver) {
    this.driver = driver;
  }

  public logMigrationSucceeded(migration: Migration): void {
    this.driver.log(`Migration ${migration.title} successful`, {
      pg: {
        type: MigrationLogger.MESSAGE_TYPES.MIGRATION_SUCCESS,
        title: migration.title,
        duration: migration.duration,
        description: migration.description,
        fileName: migration.fileName,
      },
    });
  }

  public logMigrationSkipped(migration: Migration, reason: string): void {
    this.driver.log(`Migration ${migration.title} skipped: ${reason}`, {
      pg: {
        type: MigrationLogger.MESSAGE_TYPES.MIGRATION_SKIPPED,
        title: migration.title,
        fileName: migration.fileName,
        reason,
      },
    });
  }

  public logMigrationFailed(migration: Migration, error: unknown): void {
    let errorString = '';

    if (error instanceof AggregateError) {
      const fragments: string[] = [];

      if (error.message) {
        fragments.push(error.message);
      }

      if (error.errors.length > 0) {
        fragments.push(
          ...error.errors.map((e) =>
            e instanceof Error ? e.message : String(e),
          ),
        );
      }

      errorString = fragments.join(', ');
    } else if (error instanceof Error) {
      errorString = error.message;
    } else {
      errorString = String(error);
    }

    this.driver.error(`Migration ${migration.title} failed. ${errorString}`, {
      pg: {
        type: MigrationLogger.MESSAGE_TYPES.MIGRATION_FAILED,
        title: migration.title,
        fileName: migration.fileName,
        error: errorString,
      },
    });
  }
}
