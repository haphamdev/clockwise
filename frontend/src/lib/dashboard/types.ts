export interface MyHours {
  today: number;
  thisWeek: number;
  lastWeek: number;
  weekOverWeekPct: number | null;
  thisMonth: number;
  lastMonth: number;
  monthOverMonthPct: number | null;
}

export interface Gap {
  date: string;
  hours: number;
}

export interface RecentLog {
  id: string;
  date: string;
  projectName: string;
  taskLabels: string[];
  hours: number;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  hoursThisWeek: number;
  entriesThisWeek: number;
}

export interface MySummaryResponse {
  myHours: MyHours;
  gaps: Gap[];
  recentLogs: RecentLog[];
  projectSummaries: ProjectSummary[];
}

export interface NotLoggedUser {
  userId: string;
  userName: string;
}

export interface ThresholdBreaches {
  dailyCount: number;
  weeklyCount: number;
}

export interface TeamProject {
  projectId: string;
  projectName: string;
}

export interface TeamBreakdownItem {
  teamId: string;
  teamName: string;
  memberCount: number;
  hoursThisWeek: number;
  weekOverWeekPct: number | null;
  hoursThisMonth: number;
  monthOverMonthPct: number | null;
  notLoggedThisWeek: NotLoggedUser[];
  thresholdBreaches: ThresholdBreaches;
  activeProjects: TeamProject[];
  activeProjectCount: number;
}

export interface TeamBreakdownResponse {
  teams: TeamBreakdownItem[];
}

export interface OrgOverviewResponse {
  users: { active: number; deactivated: number };
  teams: { active: number; archived: number };
  projects: { active: number; archived: number };
}
