import { QueryRunner, type Datasource } from '@kilbergr/pg-datasource';
import { MigrationDirection } from './migration';
import { MigrationResult } from './migration-result';
import type { MigrationList } from './migration-list';
import type { MigrationLogger } from './migration-logger';
import {
  CreateMigrationTableQuery,
  FindLatestSequenceNumberQuery,
  InsertMigrationQuery,
} from './queries';
import * as E from 'fp-ts/lib/Either';
import type { DatabaseError } from 'pg';
import type { ValidationError } from 'joi';

// Random but well-known identifier shared by all instances.
const PG_MIGRATE_LOCK_ID = 708954078;

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace MigrationRunner {
  export interface Config {
    table: string;
    schema: string;
  }
}

/**
 * Abstract class for all kind of migration loaders. Migrations are not known
 * by their amount and name in advance. Therefore, they must be loaded based on
 * some pattern. That will most probably be list of directories in which the
 * migrations are located. Based on what bundler and if some is used to build
 * the application, the migration loader will be different.
 *
 * For testing purposes, a simple commonjs loader is enough. Tests are not
 * bundled by any bundler. So a simple import (require) works well.
 *
 * For compiled applications with webpack the situation is more complicated.
 * The webpack bundle does not allow to call an import from anywhere in the
 * code and load a typescript file. All has to be preloaded during the
 * compilation time and then they can be imported "dynamically"
 */
export abstract class MigrationLoader {
  /**
   * Load all migrations and return their classes. (Not instances!)
   *
   * Migrations will only be initialized when they are executed.
   */
  public abstract load(): Promise<MigrationList>;
}

export class MigrationRunner {
  private readonly datasource: Datasource;

  private readonly config: MigrationRunner.Config;

  private readonly migrationLoader: MigrationLoader;

  private readonly migrationLogger: MigrationLogger;

  // eslint-disable-next-line @typescript-eslint/max-params
  public constructor(
    datasource: Datasource,
    config: MigrationRunner.Config,
    loader: MigrationLoader,
    logger: MigrationLogger,
  ) {
    this.datasource = datasource;
    this.config = config;
    this.migrationLoader = loader;
    this.migrationLogger = logger;
  }

  public async run(
    targetSeqNum = Infinity,
  ): Promise<E.Either<DatabaseError | ValidationError, MigrationResult>> {
    // Create isolated query runner for the migration only.
    // We check if a migration is already running by another instance. If
    // yes, we will wait until it ends and then we will check what is the
    // migration status and evaluate next steps. The lock method will be
    // pending until another migration triggered by another instance is done.
    // Only than this migration will start. And because we are checking
    // status of a migration from migration tables before each migration run
    // this migration will skip all already executed steps.
    const lock = this.datasource.createAdvisorLock(PG_MIGRATE_LOCK_ID);
    const queryRunner = this.datasource.createQueryRunner();

    await lock.lock();

    // Create migration schema and tables if not exists.
    const createMigrationTableResult = await queryRunner
      .prepare(CreateMigrationTableQuery)
      .setArgs({
        schema: this.config.schema,
        table: this.config.table,
      })
      .execute();

    if (E.isLeft(createMigrationTableResult)) {
      return createMigrationTableResult;
    }

    const latestSequenceNumberResult = await queryRunner
      .prepare(FindLatestSequenceNumberQuery)
      .setArgs(this.config)
      .execute();

    if (E.isLeft(latestSequenceNumberResult)) {
      return latestSequenceNumberResult;
    }

    const latestSequenceNumber = latestSequenceNumberResult.right;

    // Resolve what is targeted migration. It can be all migrations with
    // greater seq number than the last stored one or any other specific
    // seq number which we want to lock in.
    const resolvedTargetSeqNum = targetSeqNum || Infinity;

    const migrationDirection =
      latestSequenceNumber < resolvedTargetSeqNum
        ? MigrationDirection.UP
        : MigrationDirection.DOWN;

    const result = new MigrationResult();

    const migrations = await this.migrationLoader.load();

    await queryRunner.startTransaction();

    if (migrationDirection === MigrationDirection.UP) {
      // Running UP Which means that the last stored seq number is lower than
      // the target seq number. We need to run all migrations with seq number
      // greater than the last stored seq number.
      const sortedMigrations = migrations.toArray();
      const fromSeqNum = latestSequenceNumber;
      const toSeqNum = resolvedTargetSeqNum;
      result.direction = MigrationDirection.UP;
      result.from = Number(fromSeqNum);
      result.to = Number(toSeqNum);

      for (const migration of sortedMigrations) {
        if (
          migration.sequenceNumber > fromSeqNum &&
          migration.sequenceNumber <= toSeqNum &&
          !!migration.up
        ) {
          const migrationStartTime = process.hrtime.bigint();
          try {
            // We also measure the duration of the migration and store it
            // in the migration table.
            await migration.up(queryRunner);
            result.executed.push(migration);
            this.migrationLogger.logMigrationSucceeded(migration);
          } catch (error) {
            result.setFailed(migration, error);
            this.migrationLogger.logMigrationFailed(migration, error);
            throw error;
          } finally {
            // Prevent a use case (during tests), when a duration could be
            // 0 because tests are executed too fast. Typically migration
            // stubs faking the migration up or down methods will resolve
            // immediately with 0 duration.
            migration.duration =
              QueryRunner.getDurationInMilliseconds(migrationStartTime);
          }
        } else {
          const reason = !migration.up
            ? `no "${migrationDirection}" method`
            : migration.sequenceNumber <= fromSeqNum
              ? 'already executed'
              : 'out of range';

          result.skipped.push(migration);
          this.migrationLogger.logMigrationSkipped(migration, reason);
        }
      }

      const migrationInsertResult = await queryRunner
        .prepare(InsertMigrationQuery)
        .setArgs({
          table: this.config.table,
          schema: this.config.schema,
          migrations: result.executed.map((m) => ({
            ...m,
            duration: m.duration ?? 0,
            direction: MigrationDirection.UP,
          })),
        })
        .execute();

      if (E.isLeft(migrationInsertResult)) {
        return migrationInsertResult;
      }
    } else {
      // Running DOWN which means that the last stored seq number is greater
      // than the target seq number. We need to run all migrations with seq
      // number greater than the target seq number and undo them by calling
      // their down method.
      const sortedMigrations = migrations.toArray();
      // The end migration which is supposed to be on the top and all
      // later migrations will be undone. In case of going "down" the stored
      // sequence number is lower than the target sequence number.
      const toSeqNum = resolvedTargetSeqNum;
      // The stored sequence number is from which we will be undoing the
      // migrations. Migrations with higher sequence number than the one
      // stored were never executed and has to be skipped.
      const fromSeqNum = latestSequenceNumber;
      result.direction = MigrationDirection.DOWN;
      result.from = Number(fromSeqNum);
      result.to = Number(toSeqNum);

      for (let i = sortedMigrations.length - 1; i >= 0; i--) {
        const migration = sortedMigrations[i];
        if (
          migration.sequenceNumber > toSeqNum &&
          migration.sequenceNumber <= fromSeqNum &&
          migration.down
        ) {
          const migrationStartTime = process.hrtime.bigint();
          try {
            await migration.down(queryRunner);
            result.executed.push(migration);
            this.migrationLogger.logMigrationSucceeded(migration);
          } catch (error) {
            result.setFailed(migration, error);
            this.migrationLogger.logMigrationFailed(migration, error);
            throw error;
          } finally {
            migration.duration =
              QueryRunner.getDurationInMilliseconds(migrationStartTime);
          }
        } else {
          const reason = !migration.down
            ? `no "${migrationDirection}" method`
            : migration.sequenceNumber > fromSeqNum
              ? 'never applied'
              : 'out of range';

          result.skipped.push(migration);
          this.migrationLogger.logMigrationSkipped(migration, reason);
        }
      }

      const migrationInsertResult = await queryRunner
        .prepare(InsertMigrationQuery)
        .setArgs({
          table: this.config.table,
          schema: this.config.schema,
          migrations: result.executed.map((m) => ({
            ...m,
            duration: m.duration ?? 0,
            direction: MigrationDirection.DOWN,
          })),
        })
        .execute();

      if (E.isLeft(migrationInsertResult)) {
        return migrationInsertResult;
      }
    }

    await queryRunner.commitTransaction();

    await lock.unlock();

    return E.right(result);
  }
}
