import { TeamImportProcessor } from './team-import.processor';
import { ImportCallerContext } from '../interfaces/import-processor.interface';

describe('TeamImportProcessor — parseAndValidate', () => {
  let processor: TeamImportProcessor;
  let mockTeamsService: any;
  let mockUsersService: any;

  const orgId = 'org-1';
  const userId = 'admin-1';
  const ctx: ImportCallerContext = { userId, orgId, isAdmin: true };

  const makeUser = (id: string, email: string) => ({
    id, orgId, email, name: email, avatarUrl: null,
    isAdmin: false, status: 'active', lastLoginAt: null,
    createdAt: new Date(), updatedAt: new Date(),
  });

  beforeEach(() => {
    mockTeamsService = {
      findByNameInOrg: jest.fn().mockResolvedValue(null),
      createForImport: jest.fn().mockResolvedValue({ id: 'team-new', name: 'New Team' }),
    };
    mockUsersService = {
      findByEmail: jest.fn().mockImplementation((email: string) => {
        if (email === 'bob@test.com') return Promise.resolve(makeUser('u-bob', 'bob@test.com'));
        if (email === 'alice@test.com') return Promise.resolve(makeUser('u-alice', 'alice@test.com'));
        return Promise.resolve(null);
      }),
    };
    processor = new TeamImportProcessor(mockTeamsService, mockUsersService);
  });

  const validCsv = [
    'name,description,members,managers',
    'Engineering,The eng team,alice@test.com,bob@test.com',
  ].join('\n');

  it('should have type "team"', () => {
    expect(processor.type).toBe('team');
  });

  it('should parse a valid CSV row', async () => {
    const result = await processor.parseAndValidate(validCsv, ctx);

    expect(result.totalRows).toBe(1);
    expect(result.validRows).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
    expect(result.validRows[0].data).toEqual({
      name: 'Engineering',
      description: 'The eng team',
      members: 'alice@test.com',
      managers: 'bob@test.com',
    });
  });

  it('should not leak _resolved fields in validRows', async () => {
    const result = await processor.parseAndValidate(validCsv, ctx);
    expect(result.validRows[0].data).not.toHaveProperty('_resolved_members');
  });

  it('should include executableRows with resolved members', async () => {
    const result = await processor.parseAndValidate(validCsv, ctx);

    expect(result.executableRows).toHaveLength(1);
    const members = JSON.parse(result.executableRows[0].data._resolved_members);
    expect(members).toEqual([
      { userId: 'u-bob', role: 'manager' },
      { userId: 'u-alice', role: 'member' },
    ]);
  });

  describe('header validation', () => {
    it('should reject CSV with missing required headers', async () => {
      const csv = 'name,members\nTest,bob@test.com';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 1,
        message: expect.stringContaining('Missing: description'),
      });
    });

    it('should accept CSV with only required headers (no members/managers columns)', async () => {
      const csv = 'name,description\nTeam A,A team';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.validRows[0].data).toEqual({
        name: 'Team A',
        description: 'A team',
        members: '',
        managers: '',
      });
      const members = JSON.parse(result.executableRows[0].data._resolved_members);
      expect(members).toEqual([]);
    });
  });

  describe('name validation', () => {
    it('should reject rows with empty name', async () => {
      const csv = 'name,description,members,managers\n,,alice@test.com,bob@test.com';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({ row: 2, field: 'name' });
    });

    it('should reject name over 255 characters', async () => {
      const longName = 'a'.repeat(256);
      const csv = `name,description,members,managers\n${longName},,alice@test.com,bob@test.com`;
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({ row: 2, field: 'name', message: expect.stringContaining('255') });
    });
  });

  describe('duplicate detection', () => {
    it('should reject team that already exists in DB', async () => {
      mockTeamsService.findByNameInOrg.mockResolvedValue({ id: 'existing', name: 'Engineering', isArchived: false });
      const result = await processor.parseAndValidate(validCsv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({ row: 2, field: 'name', message: expect.stringContaining('already exists') });
    });

    it('should indicate when existing team is archived', async () => {
      mockTeamsService.findByNameInOrg.mockResolvedValue({ id: 'existing', name: 'Engineering', isArchived: true });
      const result = await processor.parseAndValidate(validCsv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: 'name',
        message: expect.stringContaining('(archived)'),
      });
    });

    it('should detect intra-CSV duplicate team names', async () => {
      const csv = [
        'name,description,members,managers',
        'Engineering,,alice@test.com,bob@test.com',
        'Engineering,,alice@test.com,bob@test.com',
      ].join('\n');
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ row: 3, message: expect.stringContaining('Duplicate') });
    });

    it('should cache team name lookups', async () => {
      const csv = [
        'name,description,members,managers',
        'Team A,,alice@test.com,bob@test.com',
        'Team B,,alice@test.com,bob@test.com',
      ].join('\n');
      await processor.parseAndValidate(csv, ctx);

      expect(mockTeamsService.findByNameInOrg).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty CSV', async () => {
      const result = await processor.parseAndValidate('', ctx);
      expect(result.totalRows).toBe(0);
      expect(result.validRows).toHaveLength(0);
    });

    it('should skip empty rows', async () => {
      const csv = [
        'name,description,members,managers',
        'Team A,,alice@test.com,bob@test.com',
        '',
        '  ',
      ].join('\n');
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.totalRows).toBe(1);
      expect(result.validRows).toHaveLength(1);
    });

    it('should handle comma-separated members in quoted field', async () => {
      const csv = [
        'name,description,members,managers',
        'Team A,,"alice@test.com, bob@test.com",bob@test.com',
      ].join('\n');
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      const members = JSON.parse(result.executableRows[0].data._resolved_members);
      expect(members).toHaveLength(2);
    });

    it('should include row data on error objects', async () => {
      const csv = 'name,description,members,managers\n,,alice@test.com,bob@test.com';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.errors[0].data).toBeDefined();
      expect(result.errors[0].data?.name).toBe('');
    });

    it('should allow optional description', async () => {
      const csv = 'name,description,members,managers\nTeam A,,,bob@test.com';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].data.description).toBe('');
    });
  });
});
