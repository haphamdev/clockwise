export interface CsvTemplate {
  filename: string;
  content: string;
}

export const CSV_TEMPLATES: Record<string, CsvTemplate> = {
  "time-log": {
    filename: "time-log-import-template.csv",
    content: [
      "date,project_name,task,hours,notes,user_email",
      "YYYY-MM-DD,My Project,Design review,2.5,Optional notes,",
      "",
    ].join("\n"),
  },
  team: {
    filename: "team-import-template.csv",
    content: [
      "name,description,members,managers",
      'Engineering,The engineering team,"alice@example.com, bob@example.com",carol@example.com',
      "",
    ].join("\n"),
  },
  project: {
    filename: "project-import-template.csv",
    content: [
      "name,description,status,teams,daily_hour_limit,weekly_hour_limit",
      'My Project,A sample project,active,"Engineering, Design",8,40',
      "",
    ].join("\n"),
  },
  invitation: {
    filename: "invitation-import-template.csv",
    content: [
      "email,teams,manager_teams",
      'alice@example.com,"Engineering, Design",Engineering',
      "",
    ].join("\n"),
  },
};
