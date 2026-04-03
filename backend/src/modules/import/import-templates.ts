export interface CsvTemplate {
  filename: string;
  content: string;
}

export const CSV_TEMPLATES: Record<string, CsvTemplate> = {
  'time-log': {
    filename: 'time-log-import-template.csv',
    content: [
      'date,project_name,task,hours,notes,user_email',
      'YYYY-MM-DD,My Project,Design review,2.5,Optional notes,',
      '',
    ].join('\n'),
  },
  'team': {
    filename: 'team-import-template.csv',
    content: [
      'name,description,members,managers',
      'Engineering,The engineering team,"alice@example.com, bob@example.com",carol@example.com',
      '',
    ].join('\n'),
  },
};
