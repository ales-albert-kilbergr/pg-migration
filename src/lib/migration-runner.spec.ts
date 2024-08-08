/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/unbound-method */
import { type MigrationLoader, MigrationRunner } from './migration-runner';
import { mock } from 'jest-mock-extended';
import type { MigrationLogger } from './migration-logger';
import type {
  Datasource,
  AdvisoryLock,
  QueryRunner,
} from '@kilbergr/pg-datasource';
import { stringRandom } from '@kilbergr/string';
import type { Migration } from './migration';
import { MigrationList } from './migration-list';
import type { MigrationRepository } from './migration-repository';

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace mockMigrationRunner {
  export interface Options {
    datasource?: Datasource;
    config?: MigrationRunner.Config;
    loader?: MigrationLoader;
    logger?: MigrationLogger;
    findLatestSequenceNumber?: number;
  }
}

function mockMigrationRunner(
  options: mockMigrationRunner.Options = {},
): MigrationRunner {
  return new MigrationRunner(
    options.datasource ??
      mock<Datasource>({
        createAdvisorLock: jest.fn().mockReturnValue(mock<AdvisoryLock>()),
        createQueryRunner: jest.fn().mockReturnValue(
          mock<QueryRunner>({
            createRepository: jest.fn().mockReturnValue(
              mock<MigrationRepository>({
                findLatestSequenceNumber: jest
                  .fn()
                  .mockResolvedValue(options.findLatestSequenceNumber ?? 0),
              }),
            ),
          }),
        ),
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
    const runner = mockMigrationRunner({
      loader: mock<MigrationLoader>({
        load: jest.fn().mockResolvedValue(migrationList),
      }),
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
    const runner = mockMigrationRunner({
      loader: mock<MigrationLoader>({
        load: jest.fn().mockResolvedValue(migrationList),
      }),
      findLatestSequenceNumber: 1,
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
    const runner = mockMigrationRunner({
      loader: mock<MigrationLoader>({
        load: jest.fn().mockResolvedValue(migrationList),
      }),
      findLatestSequenceNumber: 2,
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
    const runner = mockMigrationRunner({
      loader: mock<MigrationLoader>({
        load: jest.fn().mockResolvedValue(migrationList),
      }),
      findLatestSequenceNumber: 2,
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
    const runner = mockMigrationRunner({
      loader: mock<MigrationLoader>({
        load: jest.fn().mockResolvedValue(migrationList),
      }),
      findLatestSequenceNumber: 2,
    });

    // Act
    await runner.run(1);

    // Assert
    expect(migrationOne.down).not.toHaveBeenCalled();
    expect(migrationTwo.down).toHaveBeenCalled();
  });
});
