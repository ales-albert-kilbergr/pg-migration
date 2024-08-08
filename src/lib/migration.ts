import type { QueryRunner } from '@kilbergr/pg-datasource';
import type { migrationFileName } from './migration-file-name';

export class MigrationTypeError extends TypeError {}

/**
 * A migration interface. Each migration should contain at least
 * one of those methods: `up` or `down`. The `up` method is invoked when
 * migration is being processed from earlier to later migration steps. The `down`
 * method is invoked when migration is being revoked.
 *
 * When writing migration sql please do not use any dynamically generated
 * variables in the sql. The sql should be static and should not depend on
 * on any runtime state. Otherwise the migration could yield different results
 * if replied on different environments.
 *
 * A migration does not need to be a class as it does not contain any internal
 * state to be shared between methods. It can be a simple object with methods
 * as properties. It is recommended that a migration is an all export out of
 * a module like this:
 *
 * ```ts
 * // 1234567890-create-table.migration.ts
 * export const title = 'Create table';
 *
 * export const description = `
 *  Long description about what this migration is about. The description
 *  will be trimmed before being stored in the database.
 * `;
 *
 * export function async up(queryRunner: PoolClient) {
 *  await queryRunner.query(`
 *    CREATE TABLE IF NOT EXISTS my_table (...)
 *  `);
 * }
 *
 * export function async down(queryRunner: PoolClient) {
 *  await queryRunner.query(`
 *    DROP TABLE IF EXISTS my_table
 *  `);
 * }
 * ```
 * The migration is supposed only to create or modify db structures. For such
 * reason no DI container should be needed.
 *
 */
export class Migration {
  /**
   * The title of the migration. The title is human readable explanation
   * of what the migration is about because sometimes a class name might
   * not be descriptive enough. The migration title has to be
   * always set.
   *
   * If not set, the title will be resolved from the migration file name.
   */
  public title!: string;
  /**
   * The description of the migration. The description is a human readable
   * explanation of what the migration is about.
   */
  public description?: string;
  /**
   * The name of the file where the migration is defined. The file name
   * will be filled by the migration runner. Because the migration files
   * can be compiled together with many other files, it is not possible
   * to get the file name from __file constant.
   *
   * The fileName will be resolved by a migration loader
   */
  public fileName!: migrationFileName;
  /**
   * The sequence number of the migration. The sequence number defines
   * the order of migrations. The migrations are sorted by sequence number
   * in ascending order. It is recommended to use a timestamp as a sequence
   * number. The sequence number will be resolved from the migration file name.
   * It is advisable to use a timestamp as a sequence number.
   */
  public sequenceNumber!: number;
  /**
   * The duration of the migration in milliseconds. The duration will be
   * filled by the migration runner.
   */
  public duration?: number;
  /**
   * Check if a given value is a PostgresMigration. Method acts as type guard.
   */
  public static isMigration(value: unknown): value is Migration {
    return (
      typeof value === 'object' &&
      value !== null &&
      (typeof (value as Migration).up === 'function' ||
        typeof (value as Migration).down === 'function')
    );
  }
  /**
   * A type assertion to check if a given value is a valid postgres migration.
   *
   * @throws {PostgresMigrationTypeError}
   */
  public static assert(value: unknown): asserts value is Migration {
    if (!Migration.isMigration(value)) {
      throw new MigrationTypeError(`Does not implement up or down`);
    }
  }
  /**
   * Creates a new instance of PostgresMigration out of a plain object.
   *
   * @throws {PostgresMigrationTypeError}
   */
  public static create(props: unknown): Migration {
    Migration.assert(props);

    const migration = new Migration();
    Object.assign(migration, props);

    return migration;
  }
  /**
   * Apply current migration step on database.
   *
   * @param queryRunner Postgres pool queryRunner. Client is initialized and will be
   *    released by migration runner.
   */
  public up?(queryRunner: QueryRunner): Promise<void>;
  /**
   * Revoke current migration step from database
   *
   * @param queryRunner Postgres pool queryRunner. Client is initialized and will be
   *    released by migration runner.
   */
  public down?(queryRunner: QueryRunner): Promise<void>;
}

export enum MigrationDirection {
  UP = 'up',
  DOWN = 'down',
}
