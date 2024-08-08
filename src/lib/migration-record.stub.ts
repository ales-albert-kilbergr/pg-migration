import { MigrationDirection } from './migration';
import { MigrationFileName } from './migration-file-name';
import { MigrationFileNameStub } from './migration-file-name.stub';
import { MigrationRecord } from './migration-record';

export function MigrationRecordStub(
  override: Partial<MigrationRecord> = {},
): MigrationRecord {
  const record = new MigrationRecord();
  const {
    fileName: fileName,
    sequenceNumber,
    title,
  } = MigrationFileName.parse(override.fileName ?? MigrationFileNameStub());
  record.fileName = fileName;
  record.sequenceNumber = sequenceNumber;
  record.direction = override.direction ?? MigrationDirection.UP;
  record.description = `Test description ${override.description ?? title}`;
  record.duration = override.duration ?? 0;
  record.createdAt = override.createdAt ?? new Date();
  return record;
}
