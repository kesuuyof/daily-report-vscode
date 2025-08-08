import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DailyReportConfig, ReportEntry, FileInfo } from './types';

export class FileManager {
  private config: DailyReportConfig;

  constructor(config: DailyReportConfig) {
    this.config = config;
  }

  private formatDateForFile(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    // File naming: YYYYMMDD (no hyphens)
    return `${year}${month}${day}`;
  }

  private formatDateForDisplay(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    // Display in header: YYYY-MM-DD
    return `${year}-${month}-${day}`;
  }

  private formatTime(date: Date): string {
    if (this.config.timeFormat === '24h') {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } else {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
  }

  private getReportsDirectory(): string {
    let dir = this.config.reportsDirectory;
    
    // Handle ~/path notation
    if (dir.startsWith('~/')) {
      dir = path.join(os.homedir(), dir.slice(2));
    } else if (!path.isAbsolute(dir)) {
      // If relative path, resolve from home directory
      dir = path.resolve(os.homedir(), dir);
    }
    
    return dir;
  }

  private ensureReportsDirectory(): void {
    const reportsDir = this.getReportsDirectory();
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
  }

  public getTodayFileInfo(): FileInfo {
    const today = new Date();
    const dateStr = this.formatDateForFile(today);
    const reportsDir = this.getReportsDirectory();
    const filePath = path.join(reportsDir, `${dateStr}.md`);
    
    return {
      path: filePath,
      exists: fs.existsSync(filePath),
      date: dateStr
    };
  }

  public createDailyReportFile(date?: Date): string {
    this.ensureReportsDirectory();
    
    const targetDate = date || new Date();
    const displayDateStr = this.formatDateForDisplay(targetDate);
    const fileInfo = this.getTodayFileInfo();
    
    if (fileInfo.exists) {
      vscode.window.showInformationMessage(`Daily report for ${displayDateStr} already exists.`);
      return fileInfo.path;
    }

    const template = this.generateTemplate(displayDateStr);
    fs.writeFileSync(fileInfo.path, template, 'utf8');
    
    vscode.window.showInformationMessage(`Daily report created: ${path.basename(fileInfo.path)}`);
    return fileInfo.path;
  }

  private generateTemplate(dateStr: string): string {
    const header = this.config.template.header.replace('{{date}}', dateStr);
    const sections = this.config.template.sections.join('\n\n');
    return `${header}\n\n${sections}\n`;
  }

  public addEntry(content: string, date?: Date): void {
    const targetDate = date || new Date();
    const fileInfo = this.getTodayFileInfo();
    
    if (!fileInfo.exists) {
      this.createDailyReportFile(targetDate);
    }

    const time = this.formatTime(targetDate);
    const entry = `- ${time} ${content}\n`;
    
    fs.appendFileSync(fileInfo.path, entry, 'utf8');
    vscode.window.showInformationMessage(`Entry added to daily report at ${time}`);
  }

  public async openTodayReport(): Promise<void> {
    const fileInfo = this.getTodayFileInfo();
    
    if (!fileInfo.exists) {
      const shouldCreate = await vscode.window.showQuickPick(
        ['Yes', 'No'],
        { placeHolder: 'Today\'s report doesn\'t exist. Create it?' }
      );
      
      if (shouldCreate === 'Yes') {
        this.createDailyReportFile();
      } else {
        return;
      }
    }

    const document = await vscode.workspace.openTextDocument(fileInfo.path);
    await vscode.window.showTextDocument(document);
  }
}
