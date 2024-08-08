import { type Migration, MigrationDirection } from './migration';

export class MigrationResult {
  public direction: MigrationDirection = MigrationDirection.UP;

  public executed: Migration[] = [];

  public skipped: Migration[] = [];

  public failed: Migration[] = [];

  public error: unknown;

  public duration = 0;

  public from = 0;

  public to = 0;

  public setFailed(migration: Migration, error: unknown): void {
    this.failed.push(migration);
    this.error = error;
  }

  public getAllMigrations(): Migration[] {
    return [...this.executed, ...this.skipped, ...this.failed];
  }

  public getMigrationStatus(
    migration: Migration,
  ): 'executed' | 'skipped' | 'failed' | 'unknown' {
    if (this.executed.includes(migration)) {
      return 'executed';
    }
    if (this.skipped.includes(migration)) {
      return 'skipped';
    }
    if (this.failed.includes(migration)) {
      return 'failed';
    }
    return 'unknown';
  }

  public getMaxFileNameLength(): number {
    return Math.max(
      ...this.executed.map((migration) => migration.fileName.length),
      ...this.skipped.map((migration) => migration.fileName.length),
      ...this.failed.map((migration) => migration.fileName.length),
    );
  }

  public getSkippedSequenceNumbers(): number[] {
    return this.skipped
      .map((migration) => migration.sequenceNumber)
      .sort((a, b) => a - b);
  }

  public getExecutedSequenceNumbers(): number[] {
    return this.executed
      .map((migration) => migration.sequenceNumber)
      .sort((a, b) => a - b);
  }

  public isFailed(): boolean {
    return this.failed.length > 0;
  }
}
