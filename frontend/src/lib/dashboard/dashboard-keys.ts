export const dashboardKeys = {
  all: ["dashboard"] as const,
  mySummary: () => [...dashboardKeys.all, "my-summary"] as const,
  teamBreakdown: () => [...dashboardKeys.all, "team-breakdown"] as const,
  orgOverview: () => [...dashboardKeys.all, "org-overview"] as const,
};
