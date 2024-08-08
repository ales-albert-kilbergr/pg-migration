import {
  pickFirst,
  type QueryRunner,
  reduceToColumn,
  transformKeysToCamelCase,
  transformToInstance,
} from '@kilbergr/pg-datasource';
import { sql, Identifier, InsertColumns, InsertValues } from '@kilbergr/pg-sql';
import { MigrationRecord } from './migration-record';
import { lastValueFrom } from 'rxjs';
import type { SetOptional } from 'type-fest';
import type { migrationFileName } from './migration-file-name';
import { toSnakeCase } from '@kilbergr/string';

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace MigrationRepository {
  export interface Config {
    schema: string;
    table: string;
  }
}

export class MigrationRepository {
  private readonly queryRunner: QueryRunner;

  private readonly config: MigrationRepository.Config;

  public constructor(
    queryRunner: QueryRunner,
    config: MigrationRepository.Config,
  ) {
    this.queryRunner = queryRunner;
    this.config = config;
  }

  public async createTableIfNotExists(): Promise<void> {
    const pkName = `pk_${this.config.schema}_migration_log`;

    const queryConfig = sql`
      CREATE SCHEMA IF NOT EXISTS ${Identifier(this.config.schema)};

      CREATE TABLE IF NOT EXISTS ${Identifier(`${this.config.schema}.${this.config.table}`)} (
        sequence_number   INT NOT NULL,
        file_name         TEXT NOT NULL,
        direction         TEXT NOT NULL,
        description       TEXT,
        duration          INT DEFAULT 0,
        created_at        TIMESTAMPTZ DEFAULT NOW(),

        CONSTRAINT ${Identifier(pkName)} PRIMARY KEY (sequence_number)
      );
    `;

    await this.queryRunner.query(queryConfig);
  }

  public async findMany(): Promise<MigrationRecord[]> {
    const queryConfig = sql`
      SELECT sequence_number,
        file_name,
        direction,
        description,
        duration,
        created_at
      FROM ${Identifier(`${this.config.schema}.${this.config.table}`)}
      ORDER BY sequence_number ASC
    `;

    const result = await lastValueFrom(
      this.queryRunner
        .observe(queryConfig)
        .pipe(transformKeysToCamelCase(), transformToInstance(MigrationRecord)),
    );

    return result as MigrationRecord[];
  }

  public async findOne(
    fileName: migrationFileName,
  ): Promise<MigrationRecord | null> {
    const queryConfig = sql`
      SELECT sequence_number,
        file_name,
        direction,
        description,
        duration,
        created_at
      FROM ${Identifier(`${this.config.schema}.${this.config.table}`)}
      WHERE file_name = :${fileName}
    `;

    const result = await lastValueFrom(
      this.queryRunner
        .observe(queryConfig)
        .pipe(
          transformKeysToCamelCase(),
          transformToInstance(MigrationRecord),
          pickFirst(),
        ),
    );

    return result ?? null;
  }

  public async findLatestSequenceNumber(): Promise<number> {
    const queryConfig = sql`
      SELECT MAX(sequence_number) AS sequence_number
      FROM ${Identifier(`${this.config.schema}.${this.config.table}`)}
    `;

    const result = await lastValueFrom(
      this.queryRunner
        .observe(queryConfig)
        .pipe(reduceToColumn('sequence_number'), pickFirst()),
    );

    return (result ?? 0) as number;
  }

  public async insert(
    records: SetOptional<MigrationRecord, 'createdAt'>[],
  ): Promise<void> {
    if (records.length === 0) {
      return Promise.resolve();
    }

    const columns = Object.keys(records[0]);

    const queryConfig = sql`
      INSERT INTO 
        ${Identifier(`${this.config.schema}.${this.config.table}`)} 
        ${InsertColumns(columns, { transformKey: toSnakeCase })}
        ${InsertValues(records, { columns })}
    `;

    await this.queryRunner.query(queryConfig);

    return;
  }
}
