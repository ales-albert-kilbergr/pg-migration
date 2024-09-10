import type { SetOptional } from 'type-fest';
import type { MigrationRecord } from '../../migration-record';

export interface InsertMigrationArgs {
  schema: string;
  table: string;
  migrations: SetOptional<MigrationRecord, 'createdAt'>[];
}

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type InsertMigrationResult = void;
