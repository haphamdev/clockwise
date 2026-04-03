import { ProjectImportProcessor } from './project-import.processor';
import { ImportCallerContext } from '../interfaces/import-processor.interface';

describe('ProjectImportProcessor — parseAndValidate', () => {
  let processor: ProjectImportProcessor;
  let mockProjectsService: any;
  let mockTeamsService: any;

  const orgId = 'org-1';
  const userId = 'admin-1';
  const ctx: ImportCallerContext = { userId, orgId, isAdmin: true };

  const makeTeam = (id: string, name: string) => ({
    id, orgId, name, description: null, isArchived: false,
    createdAt: new Date(), updatedAt: new Date(),
  });

  beforeEach(() => {
    mockProjectsService = {
      findByNameInOrg: jest.fn().mockResolvedValue(null),
      createForImport: jest.fn().mockResolvedValue({
        id: 'proj-new', name: 'New Project', teams: [],
      }),
    };
    mockTeamsService = {
      findByNameInOrg: jest.fn().mockImplementation((name: string) => {
        if (name === 'Engineering') return Promise.resolve(makeTeam('t-eng', 'Engineering'));
        if (name === 'Design') return Promise.resolve(makeTeam('t-des', 'Design'));
        return Promise.resolve(null);
      }),
    };
    processor = new ProjectImportProcessor(mockProjectsService, mockTeamsService);
  });

  const validCsv = [
    'name,description,status,teams,daily_hour_limit,weekly_hour_limit',
    'My Project,A description,active,Engineering,,',
  ].join('\n');

  it('should have type "project"', () => {
    expect(processor.type).toBe('project');
  });

  it('should parse a valid CSV row', async () => {
    const result = await processor.parseAndValidate(validCsv, ctx);

    expect(result.totalRows).toBe(1);
    expect(result.validRows).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
    expect(result.validRows[0].data).toEqual({
      name: 'My Project',
      description: 'A description',
      status: 'active',
      teams: 'Engineering',
      daily_hour_limit: '',
      weekly_hour_limit: '',
    });
  });

  it('should not leak _resolved fields in validRows', async () => {
    const result = await processor.parseAndValidate(validCsv, ctx);
    expect(result.validRows[0].data).not.toHaveProperty('_resolved_team_ids');
  });

  it('should include executableRows with resolved team IDs', async () => {
    const csv = [
      'name,description,status,teams,daily_hour_limit,weekly_hour_limit',
      'My Project,,active,"Engineering, Design",,',
    ].join('\n');
    const result = await processor.parseAndValidate(csv, ctx);

    expect(result.executableRows).toHaveLength(1);
    const teamIds = JSON.parse(result.executableRows[0].data._resolved_team_ids);
    expect(teamIds).toEqual(['t-eng', 't-des']);
  });

  describe('header validation', () => {
    it('should reject CSV with missing required headers', async () => {
      const csv = 'name,description\nTest,Desc';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 1,
        message: expect.stringContaining('Missing'),
      });
    });
  });

  describe('name validation', () => {
    it('should reject rows with empty name', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\n,,active,Engineering,,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({ row: 2, field: 'name' });
    });

    it('should reject name over 255 characters', async () => {
      const longName = 'a'.repeat(256);
      const csv = `name,description,status,teams,daily_hour_limit,weekly_hour_limit\n${longName},,active,Engineering,,`;
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2, field: 'name', message: expect.stringContaining('255'),
      });
    });
  });

  describe('status validation', () => {
    it('should default status to active when empty', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,,Engineering,,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.executableRows[0].data.status).toBe('active');
    });

    it('should accept "archived" status', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,archived,Engineering,,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].data.status).toBe('archived');
    });

    it('should reject invalid status', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,deleted,Engineering,,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2, field: 'status', message: expect.stringContaining('active'),
      });
    });
  });

  describe('teams validation', () => {
    it('should error when teams column is empty', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,,,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2, field: 'teams', message: expect.stringContaining('required'),
      });
    });

    it('should error when any team is not found', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,"Engineering, Unknown",,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2, field: 'teams', message: expect.stringContaining('Unknown'),
      });
    });

    it('should error when team is archived', async () => {
      mockTeamsService.findByNameInOrg.mockImplementation((name: string) => {
        if (name === 'Engineering') {
          return Promise.resolve({ ...makeTeam('t-eng', 'Engineering'), isArchived: true });
        }
        return Promise.resolve(null);
      });

      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,Engineering,,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2, field: 'teams', message: expect.stringContaining('archived'),
      });
    });

    it('should resolve multiple teams', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,"Engineering, Design",,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      const teamIds = JSON.parse(result.executableRows[0].data._resolved_team_ids);
      expect(teamIds).toEqual(['t-eng', 't-des']);
    });

    it('should deduplicate team names', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,"Engineering, Engineering",,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      const teamIds = JSON.parse(result.executableRows[0].data._resolved_team_ids);
      expect(teamIds).toEqual(['t-eng']);
    });

    it('should cache team lookups', async () => {
      const csv = [
        'name,description,status,teams,daily_hour_limit,weekly_hour_limit',
        'Project A,,active,Engineering,,',
        'Project B,,active,Engineering,,',
      ].join('\n');
      await processor.parseAndValidate(csv, ctx);

      expect(mockTeamsService.findByNameInOrg).toHaveBeenCalledTimes(1);
    });
  });

  describe('hour limit validation', () => {
    it('should accept valid daily and weekly limits', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,Engineering,8,40';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].data.daily_hour_limit).toBe('8');
      expect(result.validRows[0].data.weekly_hour_limit).toBe('40');
    });

    it('should accept decimal hour limits', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,Engineering,0.5,2.5';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
    });

    it('should reject daily_hour_limit below 0.01', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,Engineering,0,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2, field: 'daily_hour_limit', message: expect.stringContaining('0.01'),
      });
    });

    it('should reject daily_hour_limit above 24', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,Engineering,25,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2, field: 'daily_hour_limit', message: expect.stringContaining('24'),
      });
    });

    it('should reject weekly_hour_limit below 0.01', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,Engineering,,0';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2, field: 'weekly_hour_limit', message: expect.stringContaining('0.01'),
      });
    });

    it('should reject weekly_hour_limit above 168', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,Engineering,,200';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2, field: 'weekly_hour_limit', message: expect.stringContaining('168'),
      });
    });

    it('should reject negative daily_hour_limit', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,Engineering,-1,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2, field: 'daily_hour_limit', message: expect.stringContaining('0.01'),
      });
    });

    it('should reject negative weekly_hour_limit', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,Engineering,,-5';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2, field: 'weekly_hour_limit', message: expect.stringContaining('0.01'),
      });
    });

    it('should reject non-numeric hour limits', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,Engineering,abc,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2, field: 'daily_hour_limit',
      });
    });

    it('should allow empty hour limits', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,active,Engineering,,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
    });
  });

  describe('duplicate detection', () => {
    it('should reject project that already exists in DB', async () => {
      mockProjectsService.findByNameInOrg.mockResolvedValue({
        id: 'existing', name: 'My Project', status: 'active',
      });
      const result = await processor.parseAndValidate(validCsv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2, field: 'name', message: expect.stringContaining('already exists'),
      });
    });

    it('should indicate when existing project is archived', async () => {
      mockProjectsService.findByNameInOrg.mockResolvedValue({
        id: 'existing', name: 'My Project', status: 'archived',
      });
      const result = await processor.parseAndValidate(validCsv, ctx);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors[0]).toMatchObject({
        row: 2, field: 'name', message: expect.stringContaining('(archived)'),
      });
    });

    it('should detect intra-CSV duplicate project names', async () => {
      const csv = [
        'name,description,status,teams,daily_hour_limit,weekly_hour_limit',
        'Test,,active,Engineering,,',
        'Test,,active,Engineering,,',
      ].join('\n');
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ row: 3, message: expect.stringContaining('Duplicate') });
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
        'name,description,status,teams,daily_hour_limit,weekly_hour_limit',
        'Test,,active,Engineering,,',
        '',
        '  ',
      ].join('\n');
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.totalRows).toBe(1);
      expect(result.validRows).toHaveLength(1);
    });

    it('should include row data on error objects', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\n,,active,Engineering,,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.errors[0].data).toBeDefined();
      expect(result.errors[0].data?.name).toBe('');
    });

    it('should allow optional description', async () => {
      const csv = 'name,description,status,teams,daily_hour_limit,weekly_hour_limit\nTest,,,Engineering,,';
      const result = await processor.parseAndValidate(csv, ctx);

      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].data.description).toBe('');
    });
  });
});

describe('ProjectImportProcessor — execute', () => {
  let processor: ProjectImportProcessor;
  let mockProjectsService: any;
  let mockTeamsService: any;

  const orgId = 'org-1';
  const userId = 'admin-1';
  const ctx: ImportCallerContext = { userId, orgId, isAdmin: true };

  beforeEach(() => {
    mockProjectsService = {
      findByNameInOrg: jest.fn(),
      createForImport: jest.fn().mockResolvedValue({
        id: 'proj-new', name: 'Test', teams: [],
      }),
    };
    mockTeamsService = { findByNameInOrg: jest.fn() };
    processor = new ProjectImportProcessor(mockProjectsService, mockTeamsService);
  });

  it('should create projects from valid rows', async () => {
    const rows = [
      {
        rowNumber: 2,
        data: {
          name: 'Test',
          description: 'Desc',
          status: 'active',
          teams: 'Engineering',
          daily_hour_limit: '8',
          weekly_hour_limit: '40',
          _resolved_team_ids: '["t-eng"]',
        },
      },
    ];

    const result = await processor.execute(rows, ctx);

    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(mockProjectsService.createForImport).toHaveBeenCalledWith(
      orgId,
      {
        name: 'Test',
        description: 'Desc',
        status: 'active',
        teamIds: ['t-eng'],
        settings: { dailyHourLimit: 8, weeklyHourLimit: 40 },
      },
      userId,
    );
  });

  it('should pass undefined for empty description', async () => {
    const rows = [
      {
        rowNumber: 2,
        data: {
          name: 'Test',
          description: '',
          status: 'active',
          teams: 'Engineering',
          daily_hour_limit: '',
          weekly_hour_limit: '',
          _resolved_team_ids: '["t-eng"]',
        },
      },
    ];

    await processor.execute(rows, ctx);

    expect(mockProjectsService.createForImport).toHaveBeenCalledWith(
      orgId,
      expect.objectContaining({
        description: undefined,
        settings: { dailyHourLimit: undefined, weeklyHourLimit: undefined },
      }),
      userId,
    );
  });

  it('should continue on row failure and report errors', async () => {
    mockProjectsService.createForImport
      .mockRejectedValueOnce(new Error('DB error'))
      .mockResolvedValueOnce({ id: 'proj-2', name: 'P2', teams: [] });

    const rows = [
      { rowNumber: 2, data: { name: 'P1', description: '', status: 'active', teams: 'E', daily_hour_limit: '', weekly_hour_limit: '', _resolved_team_ids: '["t-1"]' } },
      { rowNumber: 3, data: { name: 'P2', description: '', status: 'active', teams: 'E', daily_hour_limit: '', weekly_hour_limit: '', _resolved_team_ids: '["t-1"]' } },
    ];

    const result = await processor.execute(rows, ctx);

    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ row: 2, message: 'DB error' });
  });
});
