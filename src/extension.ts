import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FileManager } from './fileManager';
import { DailyReportConfig } from './types';
import { GasService } from './services/gasService';
import { EventFormatter } from './services/eventFormatter';

let fileManager: FileManager;
let gasService: GasService;

export function activate(context: vscode.ExtensionContext) {
  try {
    const config = loadConfig();
    fileManager = new FileManager(config);
    gasService = new GasService();

    const createReportCommand = vscode.commands.registerCommand(
      'dailyReport.createReport',
      async () => {
        try {
          const filePath = fileManager.createDailyReportFile();
          await fileManager.openTodayReport();
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to create daily report: ${error}`);
        }
      }
    );

    const addEntryCommand = vscode.commands.registerCommand(
      'dailyReport.addEntry',
      async () => {
        try {
          const entry = await vscode.window.showInputBox({
            placeHolder: 'Enter your report entry...',
            prompt: 'What would you like to add to today\'s report?'
          });

          if (entry && entry.trim()) {
            fileManager.addEntry(entry.trim());
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to add entry: ${error}`);
        }
      }
    );

    const importCalendarCommand = vscode.commands.registerCommand(
      'dailyReport.importCalendar',
      async () => {
        try {
          if (!gasService.isConfigured()) {
            const configure = await vscode.window.showWarningMessage(
              'Google Apps Script URL is not configured. Would you like to configure it now?',
              'Configure', 'Cancel'
            );
            
            if (configure === 'Configure') {
              await gasService.configureGasUrl();
              if (!gasService.isConfigured()) {
                return;
              }
            } else {
              return;
            }
          }

          await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Importing calendar events...",
            cancellable: false
          }, async (progress) => {
            progress.report({ increment: 0 });
            
            const events = await gasService.getTodaysEvents();
            
            progress.report({ increment: 50 });
            
            const formattedEvents = EventFormatter.formatEventsForReport(events);
            
            progress.report({ increment: 80 });
            
            // Insert calendar events into the current report
            await insertCalendarEvents(formattedEvents);
            
            progress.report({ increment: 100 });
            
            const eventCount = events.length;
            vscode.window.showInformationMessage(`Imported ${eventCount} calendar events`);
          });
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to import calendar: ${error}`);
        }
      }
    );

    const configureGasUrlCommand = vscode.commands.registerCommand(
      'dailyReport.configureGasUrl',
      async () => {
        try {
          await gasService.configureGasUrl();
        } catch (error) {
          vscode.window.showErrorMessage(`Configuration failed: ${error}`);
        }
      }
    );

    context.subscriptions.push(
      createReportCommand, 
      addEntryCommand, 
      importCalendarCommand, 
      configureGasUrlCommand
    );
    
    vscode.window.showInformationMessage('Daily Report extension activated!');
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to activate Daily Report extension: ${error}`);
  }
}

function loadConfig(): DailyReportConfig {
  const config = vscode.workspace.getConfiguration('dailyReport');
  const reportsDirectory = config.get<string>('reportsDirectory') || '~/DailyReports';
  
  // Try to load config.json as fallback for other settings
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  let baseConfig = getDefaultConfig();
  
  if (workspaceFolder) {
    const configPath = path.join(workspaceFolder.uri.fsPath, 'config', 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        baseConfig = { ...baseConfig, ...JSON.parse(configContent) };
      } catch (error) {
        // Ignore config.json errors, use defaults
      }
    }
  }

  // Override reportsDirectory with VSCode setting
  baseConfig.reportsDirectory = reportsDirectory;
  return baseConfig;
}

function getDefaultConfig(): DailyReportConfig {
  return {
    reportsDirectory: '~/DailyReports',
    fileNameFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    template: {
      header: '# Daily Report - {{date}}',
      sections: [
        '## 本日の作業',
        '## 課題・所感',
        '## 明日の予定'
      ]
    }
  };
}

async function insertCalendarEvents(formattedEvents: string): Promise<void> {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    // No active editor, create a new report
    await fileManager.openTodayReport();
    return insertCalendarEvents(formattedEvents);
  }

  const document = activeEditor.document;
  const content = document.getText();
  
  // Find the position to insert calendar events
  const lines = content.split('\n');
  let insertPosition = 0;
  
  // Look for existing calendar section
  const calendarSectionRegex = /^## 本日のMTG予定/;
  const existingCalendarLine = lines.findIndex(line => calendarSectionRegex.test(line));
  
  if (existingCalendarLine !== -1) {
    // Replace existing calendar section
    const nextSectionIndex = lines.findIndex((line, index) => 
      index > existingCalendarLine && line.startsWith('## ')
    );
    
    const startLine = existingCalendarLine;
    const endLine = nextSectionIndex !== -1 ? nextSectionIndex : lines.length;
    
    const startPosition = new vscode.Position(startLine, 0);
    const endPosition = new vscode.Position(endLine, 0);
    const range = new vscode.Range(startPosition, endPosition);
    
    await activeEditor.edit(editBuilder => {
      editBuilder.replace(range, formattedEvents);
    });
  } else {
    // Insert after header
    const headerLine = lines.findIndex(line => line.startsWith('# '));
    insertPosition = headerLine !== -1 ? headerLine + 1 : 0;
    
    const insertPos = new vscode.Position(insertPosition, 0);
    await activeEditor.edit(editBuilder => {
      editBuilder.insert(insertPos, formattedEvents + '\n');
    });
  }
}

export function deactivate() {
  vscode.window.showInformationMessage('Daily Report extension deactivated.');
}