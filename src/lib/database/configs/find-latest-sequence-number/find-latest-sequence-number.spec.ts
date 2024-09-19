import { FindLatestSequenceNumber } from './find-latest-sequence-number.config';

describe('(Unit) FindLatestSequenceNumber', () => {
  it('should build the query', () => {
    // Arrange
    const args: FindLatestSequenceNumber.Args = {
      schema: 'schema',
      table: 'table',
    };
    // Act
    const query = FindLatestSequenceNumber(args);
    // Assert
    expect(query).toMatchObject({
      text: 'SELECT MAX(sequence_number) AS sequence_number FROM "schema"."table"',
    });
  });
});
