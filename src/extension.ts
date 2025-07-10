import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FileManager } from './fileManager';
import { DailyReportConfig } from './types';

let fileManager: FileManager;

export function activate(context: vscode.ExtensionContext) {
  try {
    const config = loadConfig();
    fileManager = new FileManager(config);

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

    context.subscriptions.push(createReportCommand, addEntryCommand);
    
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

export function deactivate() {
  vscode.window.showInformationMessage('Daily Report extension deactivated.');
}