/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/unbound-method */
import { type MigrationLoader, MigrationRunner } from './migration-runner';
import { mock, type MockProxy } from 'jest-mock-extended';
import type { MigrationLogger } from './migration-logger';
import type {
  Datasource,
  AdvisoryLock,
  QueryRunner,
  SqlStatement,
} from '@kilbergr/pg-datasource';
import { stringRandom } from '@kilbergr/string';
import type { Migration } from './migration';
import { MigrationList } from './migration-list';
import { DatabaseError } from 'pg';
import * as E from 'fp-ts/lib/Either';
import {
  CreateMigrationTableStatement,
  FindLatestSequenceNumberStatement,
  InsertMigrationStatement,
} from './database';
import type { ValidationError } from 'joi';

// eslint-disable-next-line @typescript-eslint/no-namespace
class QueryMock<
  ARGS extends object,
  DATA = QueryRunner.Result,
  ERROR = DatabaseError,
> {
  public readonly statement: SqlStatement<ARGS, DATA, ERROR>;

  private mockImplementationFn: jest.Mock<
    Promise<E.Either<DatabaseError | ValidationError | ERROR, DATA>>,
    [ARGS]
  > = jest.fn<Promise<E.Either<ERROR, DATA>>, [ARGS]>();

  private args: ARGS = {} as ARGS;

  public constructor(statement: SqlStatement<ARGS, DATA, ERROR>) {
    this.statement = statement;
  }

  public setArgs(args: ARGS): this {
    this.args = args;

    return this;
  }

  public getArgs(): ARGS {
    return this.args;
  }

  public setArg<K extends keyof ARGS>(key: K, value: ARGS[K]): this {
    this.args[key] = value;

    return this;
  }

  public getArg<K extends keyof ARGS>(key: K): ARGS[K] {
    return this.args[key];
  }

  public mockImplementation(fn: (args: ARGS) => E.Either<ERROR, DATA>): this {
    this.mockImplementationFn = jest
      .fn()
      .mockImplementation(async (args: ARGS) => {
        return Promise.resolve(fn(args));
      });

    return this;
  }

  public mockResolveValue(value: E.Either<ERROR, DATA>): this {
    return this.mockImplementation(() => value);
  }

  public mockError(error: ERROR): this {
    // We do test what the statement is expected to return, not the
    // result processing flow of the statement itself.
    return this.mockResolveValue(E.left(error));
  }

  public mockResult(result: DATA): this {
    return this.mockResolveValue(E.right(result));
  }

  public mockVoidResult(): this {
    return this.mockResult(void 0 as unknown as DATA);
  }

  public async execute(): Promise<
    E.Either<ERROR | DatabaseError | ValidationError, DATA>
  > {
    return this.mockImplementationFn(this.args);
  }
}

type QueryRunnerMock = MockProxy<QueryRunner> & {
  mockStatement: <
    ARGS extends object,
    DATA = QueryRunner.Result,
    ERROR = DatabaseError,
  >(
    statement: SqlStatement<ARGS, DATA, ERROR>,
  ) => QueryMock<ARGS, DATA, ERROR>;

  hasMockedStatement: <
    ARGS extends object,
    DATA = QueryRunner.Result,
    ERROR = DatabaseError,
  >(
    statement: SqlStatement<ARGS, DATA, ERROR>,
  ) => boolean;
};

function mockQueryRunner(): QueryRunnerMock {
  const mockedStatements = new Map();

  const mockedQueryRunner = mock<QueryRunner>({
    prepare: jest.fn().mockImplementation((statement, args) => {
      const queryMock = mockedStatements.get(statement);
      if (queryMock === undefined) {
        throw new Error(`Query mock not found for statement: ${statement}`);
      }

      queryMock.setArgs(args);

      return queryMock;
    }),
  });

  return Object.assign(mockedQueryRunner, {
    mockStatement: function mockStatement<
      ARGS extends object,
      DATA = QueryRunner.Result,
      ERROR = DatabaseError,
    >(
      statement: SqlStatement<ARGS, DATA, ERROR>,
    ): QueryMock<ARGS, DATA, ERROR> {
      const queryMock = new QueryMock(statement);
      mockedStatements.set(statement, queryMock);
      return queryMock;
    },

    hasMockedStatement: function hasMockStatement(
      statement: SqlStatement<object, unknown, unknown>,
    ): boolean {
      return mockedStatements.has(statement);
    },
  }) as any;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace mockMigrationRunner {
  export interface Options {
    datasource?: Datasource;
    config?: MigrationRunner.Config;
    loader?: MigrationLoader;
    logger?: MigrationLogger;
    findLatestSequenceNumber?: number;
    queryRunner?: QueryRunnerMock;
  }
}

function mockMigrationRunner(
  options: mockMigrationRunner.Options = {},
): MigrationRunner {
  const mockedQueryRunner = options.queryRunner ?? mockQueryRunner();

  if (!mockedQueryRunner.hasMockedStatement(CreateMigrationTableStatement)) {
    mockedQueryRunner
      .mockStatement(CreateMigrationTableStatement)
      .mockVoidResult();
  }

  if (
    !mockedQueryRunner.hasMockedStatement(FindLatestSequenceNumberStatement)
  ) {
    mockedQueryRunner
      .mockStatement(FindLatestSequenceNumberStatement)
      .mockResult(0);
  }

  if (!mockedQueryRunner.hasMockedStatement(InsertMigrationStatement)) {
    mockedQueryRunner.mockStatement(InsertMigrationStatement).mockVoidResult();
  }

  return new MigrationRunner(
    options.datasource ??
      mock<Datasource>({
        createAdvisorLock: jest.fn().mockReturnValue(mock<AdvisoryLock>()),
        createQueryRunner: () => mockedQueryRunner,
      }),
    options.config ?? {
      schema: `schema_${stringRandom()}`,
      table: `table_${stringRandom()}`,
    },
    options.loader ?? mock<MigrationLoader>(),
    options.logger ?? mock<MigrationLogger>(),
  );
}

describe('(Unit) MigrationRunner', () => {
  describe('Migration table creation', () => {
    it('should try to create a migration table from a config', async () => {
      // Arrange
      const migrationOne = mock<Migration>({
        sequenceNumber: 1,
      });
      const migrationList = MigrationList.from(migrationOne);
      const queryRunnerMock = mockQueryRunner();
      const schema = `migration_schema_${stringRandom()}`;
      const table = `migration_table_${stringRandom()}`;

      const createMigrationTableQueryMock = queryRunnerMock
        .mockStatement(CreateMigrationTableStatement)
        .mockVoidResult();

      const runner = mockMigrationRunner({
        loader: mock<MigrationLoader>({
          load: jest.fn().mockResolvedValue(migrationList),
        }),
        queryRunner: queryRunnerMock,
        config: {
          schema,
          table,
        },
      });

      // Act
      await runner.run();

      // Assert
      expect(createMigrationTableQueryMock.getArgs()).toMatchObject({
        schema,
        table,
      });
    });

    it('should return the database error if the table creation fails', async () => {
      // Arrange
      const migrationOne = mock<Migration>({
        sequenceNumber: 1,
      });
      const migrationList = MigrationList.from(migrationOne);
      const queryRunnerMock = mockQueryRunner();
      const schema = `migration_schema_${stringRandom()}`;
      const table = `migration_table_${stringRandom()}`;
      const error = new DatabaseError('Failed', 1, 'error');

      queryRunnerMock
        .mockStatement(CreateMigrationTableStatement)
        .mockError(error);

      const runner = mockMigrationRunner({
        loader: mock<MigrationLoader>({
          load: jest.fn().mockResolvedValue(migrationList),
        }),
        queryRunner: queryRunnerMock,
        config: {
          schema,
          table,
        },
      });

      // Act
      const result = await runner.run();

      // Assert
      expect(result).toEqual(E.left(error));
    });
  });

  describe('Reading the latest sequence number', () => {
    it('should return the database error if the sequence number read fails', async () => {
      // Arrange
      const migrationOne = mock<Migration>({
        sequenceNumber: 1,
      });
      const migrationList = MigrationList.from(migrationOne);
      const queryRunnerMock = mockQueryRunner();
      const error = new DatabaseError('Failed', 1, 'error');

      queryRunnerMock
        .mockStatement(FindLatestSequenceNumberStatement)
        .mockError(error);

      const runner = mockMigrationRunner({
        loader: mock<MigrationLoader>({
          load: jest.fn().mockResolvedValue(migrationList),
        }),
        queryRunner: queryRunnerMock,
      });

      // Act
      const result = await runner.run();

      // Assert
      expect(result).toEqual(E.left(error));
    });
  });

  it('should run all loaded migrations', async () => {
    // Arrange
    const migrationOne = mock<Migration>({
      sequenceNumber: 1,
    });
    const migrationTwo = mock<Migration>({
      sequenceNumber: 2,
    });
    const migrationList = MigrationList.from(migrationOne, migrationTwo);
    const runner = mockMigrationRunner({
      loader: mock<MigrationLoader>({
        load: jest.fn().mockResolvedValue(migrationList),
      }),
    });

    // Act
    await runner.run();

    // Assert
    expect(migrationOne.up).toHaveBeenCalled();
    expect(migrationTwo.up).toHaveBeenCalled();
  });

  it('should run migrations in correct order', async () => {
    // Arrange
    const callsOrder: number[] = [];
    const migrationOne = mock<Migration>({
      sequenceNumber: 2,
      up: jest.fn().mockImplementation(() => callsOrder.push(2)),
    });
    const migrationTwo = mock<Migration>({
      sequenceNumber: 1,
      up: jest.fn().mockImplementation(() => callsOrder.push(1)),
    });
    const migrationList = MigrationList.from(migrationOne, migrationTwo);
    const queryRunnerMock = mockQueryRunner();

    const runner = mockMigrationRunner({
      loader: mock<MigrationLoader>({
        load: jest.fn().mockResolvedValue(migrationList),
      }),
      queryRunner: queryRunnerMock,
    });
    // Act
    await runner.run();
    // Assert
    expect(callsOrder).toEqual([1, 2]);
  });

  it('should skip the migrations with lower sequence number', async () => {
    // Arrange
    const migrationOne = mock<Migration>({
      sequenceNumber: 1,
    });
    const migrationTwo = mock<Migration>({
      sequenceNumber: 2,
    });
    const migrationList = MigrationList.from(migrationOne, migrationTwo);
    const mockedQueryRunner = mockQueryRunner();
    mockedQueryRunner
      .mockStatement(FindLatestSequenceNumberStatement)
      .mockResult(1);

    const runner = mockMigrationRunner({
      loader: mock<MigrationLoader>({
        load: jest.fn().mockResolvedValue(migrationList),
      }),
      queryRunner: mockedQueryRunner,
    });

    // Act
    await runner.run();

    // Assert
    expect(migrationOne.up).not.toHaveBeenCalled();
    expect(migrationTwo.up).toHaveBeenCalled();
  });

  it('should undo all migrations', async () => {
    // Arrange
    const migrationOne = mock<Migration>({
      sequenceNumber: 1,
    });
    const migrationTwo = mock<Migration>({
      sequenceNumber: 2,
    });
    const migrationList = MigrationList.from(migrationOne, migrationTwo);
    const mockedQueryRunner = mockQueryRunner();
    mockedQueryRunner
      .mockStatement(FindLatestSequenceNumberStatement)
      .mockResult(2);
    const runner = mockMigrationRunner({
      loader: mock<MigrationLoader>({
        load: jest.fn().mockResolvedValue(migrationList),
      }),
      queryRunner: mockedQueryRunner,
    });

    // Act
    await runner.run(-1);

    // Assert
    expect(migrationOne.down).toHaveBeenCalled();
    expect(migrationTwo.down).toHaveBeenCalled();
  });

  it('should undo migrations in correct order', async () => {
    // Arrange
    const callsOrder: number[] = [];
    const migrationOne = mock<Migration>({
      sequenceNumber: 2,
      down: jest.fn().mockImplementation(() => callsOrder.push(2)),
    });
    const migrationTwo = mock<Migration>({
      sequenceNumber: 1,
      down: jest.fn().mockImplementation(() => callsOrder.push(1)),
    });
    const migrationList = MigrationList.from(migrationOne, migrationTwo);
    const mockedQueryRunner = mockQueryRunner();
    mockedQueryRunner
      .mockStatement(FindLatestSequenceNumberStatement)
      .mockResult(2);
    const runner = mockMigrationRunner({
      loader: mock<MigrationLoader>({
        load: jest.fn().mockResolvedValue(migrationList),
      }),
      queryRunner: mockedQueryRunner,
    });

    // Act
    await runner.run(-1);

    // Assert
    expect(callsOrder).toEqual([2, 1]);
  });

  it('should run the migrations down to the target sequence number', async () => {
    // Arrange
    const migrationOne = mock<Migration>({
      sequenceNumber: 1,
    });
    const migrationTwo = mock<Migration>({
      sequenceNumber: 2,
    });
    const migrationList = MigrationList.from(migrationOne, migrationTwo);
    const mockedQueryRunner = mockQueryRunner();
    mockedQueryRunner
      .mockStatement(FindLatestSequenceNumberStatement)
      .mockResult(2);
    const runner = mockMigrationRunner({
      loader: mock<MigrationLoader>({
        load: jest.fn().mockResolvedValue(migrationList),
      }),
      queryRunner: mockedQueryRunner,
    });

    // Act
    await runner.run(1);

    // Assert
    expect(migrationOne.down).not.toHaveBeenCalled();
    expect(migrationTwo.down).toHaveBeenCalled();
  });
});
