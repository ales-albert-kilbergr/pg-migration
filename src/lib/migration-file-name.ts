import {
  declareTaggedType,
  TaggedTypeError,
} from '@kilbergr/tagged-types/tagged-type';
import type { Tagged } from 'type-fest';

export interface MigrationFileNameComponents {
  /**
   * The sequence number of the migration. The sequence number defines
   * the order of migrations. The migrations are sorted by sequence number
   * in ascending order. It is recommended to use a timestamp as a sequence
   * number. The sequence number will be resolved from the migration file name.
   *
   * @example 20210916123456
   */
  sequenceNumber: number;
  /**
   * The title of the migration. The title is optional. The title helps to
   * understand the purpose of the migration. The title will be resolved from
   * the migration file name.
   *
   * @example create-product-table
   */
  title: string;
  /**
   * The original file name of the migration.
   */
  fileName: migrationFileName;
}

class MigrationFileNameTypeError extends TaggedTypeError('migrationFileName') {}

export type migrationFileName = Tagged<string, 'migrationFileName'>;

export const MigrationFileName = declareTaggedType({
  sanitize: (input: unknown): unknown => {
    return typeof input === 'string' ? input.toLowerCase() : input;
  },

  isTypeof: (input: unknown): input is migrationFileName =>
    typeof input === 'string' &&
    /^(\d+)\.?([\w\d\-_]+)?\.migration\.ts$/.test(input),

  TypeError: MigrationFileNameTypeError,

  parse: (input: migrationFileName): MigrationFileNameComponents => {
    const rx =
      /^(?<sequenceNumber>\d+)\.?(?<title>[\w\d\-_]+)?\.migration\.ts$/;

    const groups = rx.exec(input)?.groups;

    if (!groups) {
      // The error extends TypeError.
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw new MigrationFileNameTypeError(input);
    }
    return {
      sequenceNumber: Number.parseInt(groups.sequenceNumber, 10),
      title: groups.title || '',
      fileName: input,
    };
  },

  from: (input: MigrationFileNameComponents): migrationFileName => {
    return `${input.sequenceNumber}.${input.title}.migration.ts` as migrationFileName;
  },
});
