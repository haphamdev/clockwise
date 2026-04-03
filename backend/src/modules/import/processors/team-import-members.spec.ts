import { TeamImportProcessor } from './team-import.processor';
import { ImportCallerContext } from '../interfaces/import-processor.interface';

describe('TeamImportProcessor — member resolution & execute', () => {
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

  describe('member resolution', () => {
    it('should skip unknown member emails with warning', async () => {
      const csv = 'name,description,members,managers\nTeam A,,unknown@test.com,bob@test.com';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: 'members',
        message: expect.stringContaining('unknown@test.com'),
      });
    });

    it('should skip unknown manager emails with warning', async () => {
      mockUsersService.findByEmail.mockImplementation((email: string) => {
        if (email === 'good@test.com') return Promise.resolve(makeUser('u-good', 'good@test.com'));
        return Promise.resolve(null);
      });
      const csv = 'name,description,members,managers\nTeam A,,"","good@test.com,bad@test.com"';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ field: 'managers', message: expect.stringContaining('bad@test.com') });
    });

    it('should allow row with no valid managers (creates team with no members)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const csv = 'name,description,members,managers\nTeam A,,alice@test.com,bad@test.com';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      const members = JSON.parse(result.executableRows[0].data._resolved_members);
      expect(members).toEqual([]);
    });

    it('should allow CSV with members/managers columns present but all cells empty', async () => {
      const csv = 'name,description,members,managers\nTeam A,A team,,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      const members = JSON.parse(result.executableRows[0].data._resolved_members);
      expect(members).toEqual([]);
    });

    it('should allow CSV with no members/managers headers at all', async () => {
      const csv = 'name,description\nTeam A,A team';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      const members = JSON.parse(result.executableRows[0].data._resolved_members);
      expect(members).toEqual([]);
    });

    it('should reject invalid email format with specific message', async () => {
      const csv = 'name,description,members,managers\nTeam A,,not-an-email,bob@test.com';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: 'members',
        message: expect.stringContaining('not a valid email'),
      });
    });

    it('should reject invalid manager email format', async () => {
      mockUsersService.findByEmail.mockImplementation((email: string) => {
        if (email === 'alice@test.com') return Promise.resolve(makeUser('u-alice', 'alice@test.com'));
        return Promise.resolve(null);
      });
      const csv = 'name,description,members,managers\nTeam A,,,"just-a-name"';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'managers', message: expect.stringContaining('not a valid email') }),
        ]),
      );
    });

    it('should skip users from different org', async () => {
      mockUsersService.findByEmail.mockImplementation((email: string) => {
        if (email === 'other@test.com') return Promise.resolve({ ...makeUser('u-other', 'other@test.com'), orgId: 'other-org' });
        if (email === 'bob@test.com') return Promise.resolve(makeUser('u-bob', 'bob@test.com'));
        return Promise.resolve(null);
      });
      const csv = 'name,description,members,managers\nTeam A,,other@test.com,bob@test.com';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ field: 'members', message: expect.stringContaining('other@test.com') });
    });

    it('should skip inactive users', async () => {
      mockUsersService.findByEmail.mockImplementation((email: string) => {
        if (email === 'deactivated@test.com') return Promise.resolve({ ...makeUser('u-dead', 'deactivated@test.com'), status: 'deactivated' });
        if (email === 'bob@test.com') return Promise.resolve(makeUser('u-bob', 'bob@test.com'));
        return Promise.resolve(null);
      });
      const csv = 'name,description,members,managers\nTeam A,,deactivated@test.com,bob@test.com';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ field: 'members', message: expect.stringContaining('deactivated@test.com') });
    });

    it('should handle user listed as both member and manager (manager wins)', async () => {
      const csv = 'name,description,members,managers\nTeam A,,bob@test.com,bob@test.com';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      const members = JSON.parse(result.executableRows[0].data._resolved_members);
      expect(members).toHaveLength(1);
      expect(members[0]).toEqual({ userId: 'u-bob', role: 'manager' });
    });

    it('should handle empty members and managers columns gracefully', async () => {
      const csv = 'name,description,members,managers\nTeam A,,,bob@test.com';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      const members = JSON.parse(result.executableRows[0].data._resolved_members);
      expect(members).toEqual([{ userId: 'u-bob', role: 'manager' }]);
    });

    it('should cache user lookups across rows', async () => {
      const csv = [
        'name,description,members,managers',
        'Team A,,alice@test.com,bob@test.com',
        'Team B,,alice@test.com,bob@test.com',
      ].join('\n');
      await processor.parseAndValidate(csv, ctx);

      expect(mockUsersService.findByEmail).toHaveBeenCalledTimes(2); // alice + bob, not 4
    });
  });

  describe('execute', () => {
    it('should create teams via service for valid rows', async () => {
      const validRows = [
        {
          rowNumber: 2,
          data: {
            name: 'Engineering',
            description: 'The eng team',
            members: 'alice@test.com',
            managers: 'bob@test.com',
            _resolved_members: JSON.stringify([
              { userId: 'u-bob', role: 'manager' },
              { userId: 'u-alice', role: 'member' },
            ]),
          },
        },
      ];

      const result = await processor.execute(validRows, ctx);

      expect(result.totalRows).toBe(1);
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockTeamsService.createForImport).toHaveBeenCalledWith(
        orgId,
        {
          name: 'Engineering',
          description: 'The eng team',
          members: [
            { userId: 'u-bob', role: 'manager' },
            { userId: 'u-alice', role: 'member' },
          ],
        },
        userId,
      );
    });

    it('should treat empty description as undefined', async () => {
      const validRows = [
        {
          rowNumber: 2,
          data: {
            name: 'Team',
            description: '',
            members: '',
            managers: '',
            _resolved_members: JSON.stringify([{ userId: 'u-1', role: 'manager' }]),
          },
        },
      ];

      await processor.execute(validRows, ctx);

      expect(mockTeamsService.createForImport).toHaveBeenCalledWith(
        orgId,
        expect.objectContaining({ description: undefined }),
        userId,
      );
    });

    it('should continue on individual row failure and report errors', async () => {
      const validRows = [
        {
          rowNumber: 2,
          data: {
            name: 'Team A', description: '', members: '', managers: '',
            _resolved_members: JSON.stringify([{ userId: 'u-1', role: 'manager' }]),
          },
        },
        {
          rowNumber: 3,
          data: {
            name: 'Team B', description: '', members: '', managers: '',
            _resolved_members: JSON.stringify([{ userId: 'u-1', role: 'manager' }]),
          },
        },
      ];

      mockTeamsService.createForImport
        .mockResolvedValueOnce({ id: 't-1' })
        .mockRejectedValueOnce(new Error('DB error'));

      const result = await processor.execute(validRows, ctx);

      expect(result.totalRows).toBe(2);
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ row: 3 });
    });
  });
});
