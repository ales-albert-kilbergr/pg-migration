/* eslint-disable @typescript-eslint/no-magic-numbers */
import {
  type migrationFileName,
  MigrationFileName,
  type MigrationFileNameComponents,
} from './migration-file-name';

export function MigrationFileNameSequenceNumberStub(): number {
  return Math.ceil(Math.random() * Math.pow(10, 13));
}

export function MigrationFileNameStub(
  override: Partial<MigrationFileNameComponents> = {},
): migrationFileName {
  const title = override.title ?? `migration-stub-file`;
  const sequenceNumber =
    override.sequenceNumber ?? MigrationFileNameSequenceNumberStub();
  const fileName =
    `${sequenceNumber}.${title}.migration.ts` as migrationFileName;

  return MigrationFileName.from({ title, sequenceNumber, fileName });
}
