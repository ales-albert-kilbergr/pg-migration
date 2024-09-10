import type { MigrationRecord } from '../../migration-record';

export interface FindManyMigrationsArgs {
  schema: string;
  table: string;
}

export type FindManyMigrationsResult = MigrationRecord[];
