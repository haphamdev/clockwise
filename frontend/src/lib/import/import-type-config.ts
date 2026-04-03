import type { ImportType } from './types';

export interface ImportColumnDef {
  header: string;
  dataKey: string;
  isList?: boolean;
}

export interface ImportTypeConfig {
  label: string;
  pageTitle: string;
  pageDescription: string;
  uploadDescription: string;
  importingText: string;
  doneLink: string;
  doneLinkLabel: string;
  adminOnly: boolean;
  columns: ImportColumnDef[];
  detailsKey?: string;
}

export const IMPORT_TYPE_CONFIG: Record<ImportType, ImportTypeConfig> = {
  'time-log': {
    label: 'Time Logs',
    pageTitle: 'Import Time Logs',
    pageDescription: 'Upload a CSV file to bulk import time log entries.',
    uploadDescription: 'Select a CSV file to import time log entries.',
    importingText: 'Importing time logs...',
    doneLink: '/time-logs',
    doneLinkLabel: 'View Time Logs',
    adminOnly: false,
    columns: [
      { header: 'Date', dataKey: 'date' },
      { header: 'Project', dataKey: 'project_name' },
      { header: 'Task', dataKey: 'task' },
      { header: 'Hours', dataKey: 'hours' },
    ],
    detailsKey: 'notes',
  },
  team: {
    label: 'Teams',
    pageTitle: 'Import Teams',
    pageDescription: 'Upload a CSV file to bulk import teams.',
    uploadDescription: 'Select a CSV file to import teams.',
    importingText: 'Importing teams...',
    doneLink: '/admin/teams',
    doneLinkLabel: 'View Teams',
    adminOnly: true,
    columns: [
      { header: 'Name', dataKey: 'name' },
      { header: 'Description', dataKey: 'description' },
      { header: 'Members', dataKey: 'members', isList: true },
      { header: 'Managers', dataKey: 'managers', isList: true },
    ],
  },
  project: {
    label: 'Projects',
    pageTitle: 'Import Projects',
    pageDescription: 'Upload a CSV file to bulk import projects.',
    uploadDescription: 'Select a CSV file to import projects.',
    importingText: 'Importing projects...',
    doneLink: '/projects',
    doneLinkLabel: 'View Projects',
    adminOnly: true,
    columns: [
      { header: 'Name', dataKey: 'name' },
      { header: 'Description', dataKey: 'description' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Teams', dataKey: 'teams', isList: true },
      { header: 'Daily Limit', dataKey: 'daily_hour_limit' },
      { header: 'Weekly Limit', dataKey: 'weekly_hour_limit' },
    ],
  },
  invitation: {
    label: 'Invitations',
    pageTitle: 'Import Invitations',
    pageDescription: 'Upload a CSV file to bulk import invitations.',
    uploadDescription: 'Select a CSV file to import invitations.',
    importingText: 'Importing invitations...',
    doneLink: '/admin/invitations',
    doneLinkLabel: 'View Invitations',
    adminOnly: true,
    columns: [
      { header: 'Email', dataKey: 'email' },
      { header: 'Teams', dataKey: 'teams', isList: true },
      { header: 'Manager Teams', dataKey: 'manager_teams', isList: true },
    ],
  },
};

export const IMPORT_TYPE_OPTIONS = Object.entries(IMPORT_TYPE_CONFIG).map(
  ([value, config]) => ({ value: value as ImportType, label: config.label }),
);

export function isValidImportType(value: string): value is ImportType {
  return value in IMPORT_TYPE_CONFIG;
}
