export interface DailyReportConfig {
  reportsDirectory: string;
  fileNameFormat: string;
  timeFormat: '24h' | '12h';
  template: {
    header: string;
    sections: string[];
  };
}

export interface ReportEntry {
  time: string;
  content: string;
}

export interface FileInfo {
  path: string;
  exists: boolean;
  date: string;
}