import { Migration, MigrationTypeError } from './migration';

export class MigrationList {
  private readonly index: Map<number, Migration> = new Map<number, Migration>();

  public get size(): number {
    return this.index.size;
  }

  public static from(...migrations: unknown[]): MigrationList {
    return new MigrationList().add(...migrations);
  }

  public add(...migrations: unknown[]): this {
    for (const migration of migrations) {
      Migration.assert(migration);

      const seqNumber = migration.sequenceNumber;

      if (typeof seqNumber !== 'number' || isNaN(seqNumber)) {
        throw new MigrationTypeError(
          `No sequence number for migration ${migration.fileName}`,
        );
      }

      const conflictingMigration = this.index.get(seqNumber);

      if (conflictingMigration) {
        throw new MigrationTypeError(
          `Duplicate sequence number ${seqNumber} for migrations ${migration.fileName} ` +
            `and ${conflictingMigration.fileName}`,
        );
      }

      this.index.set(seqNumber, migration);
    }

    return this;
  }
  /**
   * Get a migration on given index
   *
   * @param index
   * @returns
   */
  public at(index: number): Migration | undefined {
    return this.toArray()[index];
  }

  public get(sequenceNumber: number): Migration | undefined {
    return this.index.get(sequenceNumber);
  }
  /**
   * @returns all migrations as an sorted array by sequence number in ascending
   *   order.
   */
  public toArray(): Migration[] {
    return Array.from(this.index.values()).sort((a, b) => {
      return a.sequenceNumber - b.sequenceNumber;
    });
  }
}
