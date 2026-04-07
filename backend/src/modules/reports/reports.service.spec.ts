import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import { ReportInvalidDateRangeException } from '../../common/exceptions/report.exceptions';

function makeService(repoOverrides: Partial<ReportsRepository> = {}) {
  const repo = {
    findLoggingDelayHeatmap: jest.fn().mockResolvedValue([]),
    findManagedUserIds: jest.fn().mockResolvedValue([]),
    ...repoOverrides,
  } as unknown as jest.Mocked<ReportsRepository>;

  const service = new ReportsService(repo);
  return { service, repo };
}

const baseQuery = {
  dateFrom: '2026-03-01',
  dateTo: '2026-03-31',
};

describe('ReportsService – getLoggingDelayHeatmap', () => {
  it('should validate date range and throw on invalid range', async () => {
    const { service } = makeService();

    await expect(
      service.getLoggingDelayHeatmap('org-1', 'user-1', true, {
        dateFrom: '2026-04-01',
        dateTo: '2026-03-01',
      }),
    ).rejects.toThrow(ReportInvalidDateRangeException);
  });

  it('should pass through userIds for admin (no scope restriction)', async () => {
    const { service, repo } = makeService();

    await service.getLoggingDelayHeatmap('org-1', 'admin-1', true, {
      ...baseQuery,
      userIds: ['user-a', 'user-b'],
    });

    expect(repo.findLoggingDelayHeatmap).toHaveBeenCalledWith(
      expect.objectContaining({ userIds: ['user-a', 'user-b'] }),
    );
  });

  it('should scope to managed users for non-admin (manager)', async () => {
    const { service, repo } = makeService({
      findManagedUserIds: jest.fn().mockResolvedValue(['user-2', 'user-3']),
    });

    await service.getLoggingDelayHeatmap('org-1', 'manager-1', false, baseQuery);

    // Manager sees self + managed users
    expect(repo.findLoggingDelayHeatmap).toHaveBeenCalledWith(
      expect.objectContaining({
        userIds: expect.arrayContaining(['manager-1', 'user-2', 'user-3']),
      }),
    );
  });

  it('should scope to self only for non-admin with no managed users', async () => {
    const { service, repo } = makeService({
      findManagedUserIds: jest.fn().mockResolvedValue([]),
    });

    await service.getLoggingDelayHeatmap('org-1', 'member-1', false, baseQuery);

    expect(repo.findLoggingDelayHeatmap).toHaveBeenCalledWith(
      expect.objectContaining({ userIds: ['member-1'] }),
    );
  });

  it('should intersect requestedUserIds with scope for non-admin', async () => {
    const { service, repo } = makeService({
      findManagedUserIds: jest.fn().mockResolvedValue(['user-2', 'user-3']),
    });

    await service.getLoggingDelayHeatmap('org-1', 'manager-1', false, {
      ...baseQuery,
      userIds: ['user-2', 'user-99'],
    });

    // Only user-2 is in both requested and managed
    expect(repo.findLoggingDelayHeatmap).toHaveBeenCalledWith(
      expect.objectContaining({ userIds: ['user-2'] }),
    );
  });

  it('should return cells from repository with minEntries=5', async () => {
    const { service } = makeService({
      findLoggingDelayHeatmap: jest.fn().mockResolvedValue([
        { user_id: 'user-1', user_name: 'Alice', weekday: 0, p75_delay: 2.5, entry_count: 12 },
        { user_id: 'user-1', user_name: 'Alice', weekday: 4, p75_delay: 5.0, entry_count: 8 },
      ]),
    });

    const result = await service.getLoggingDelayHeatmap('org-1', 'admin-1', true, baseQuery);

    expect(result.cells).toHaveLength(2);
    expect(result.minEntries).toBe(5);
    expect(result.cells[0]).toEqual({
      userId: 'user-1',
      userName: 'Alice',
      weekday: 0,
      p75Delay: 2.5,
      entryCount: 12,
    });
  });

  it('should pass teamIds and projectIds to repository', async () => {
    const { service, repo } = makeService();

    await service.getLoggingDelayHeatmap('org-1', 'admin-1', true, {
      ...baseQuery,
      teamIds: ['team-1'],
      projectIds: ['proj-1'],
    });

    expect(repo.findLoggingDelayHeatmap).toHaveBeenCalledWith(
      expect.objectContaining({
        teamIds: ['team-1'],
        projectIds: ['proj-1'],
      }),
    );
  });

  it('should return empty cells when repository returns empty array', async () => {
    const { service } = makeService();

    const result = await service.getLoggingDelayHeatmap('org-1', 'admin-1', true, baseQuery);

    expect(result.cells).toEqual([]);
    expect(result.minEntries).toBe(5);
  });
});
