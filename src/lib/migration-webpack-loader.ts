import { Migration } from './migration';
import {
  type migrationFileName,
  MigrationFileName,
} from './migration-file-name';
import { MigrationList } from './migration-list';
import { MigrationLoader } from './migration-runner';

/**
 * A structure to require a module in webpack bundle.
 */
export interface WebpackRequire {
  (fileName: string): { default: unknown };
  keys: () => string[];
}

export class WebpackMigrationLoader extends MigrationLoader {
  private readonly loaders: WebpackRequire[] = [];

  public constructor(loaders: WebpackRequire[]) {
    super();

    this.loaders = loaders;
  }

  private static loadMigrations(loader: WebpackRequire): Migration[] {
    return loader
      .keys()
      .filter((filePath) =>
        MigrationFileName.isTypeof(filePath.split('/').pop()),
      )
      .map((filePath) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
        const migrationProps = loader(filePath) || {};
        const fileName = filePath.split('/').pop() as migrationFileName;

        const migration = Migration.create({
          ...migrationProps,
          ...MigrationFileName.parse(fileName),
        });
        return migration;
      });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async load(): Promise<MigrationList> {
    return this.loaders
      .map((loader) => WebpackMigrationLoader.loadMigrations(loader))
      .flat()
      .reduce((list, migration) => list.add(migration), new MigrationList());
  }
}
