import type { Migration, MigrationDirection } from './migration';

export class MigrationRecord {
  public sequenceNumber!: Migration['sequenceNumber'];

  public fileName!: Migration['fileName'];

  public direction!: MigrationDirection;

  public description?: Migration['description'];

  public duration!: number;

  public createdAt!: Date;
}
