import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface GasConfig {
    webAppUrl: string;
    timeout: number;
}

export interface CalendarConfig {
    timeZone: string;
    includeAllDayEvents: boolean;
    includeLocation: boolean;
    includeAttendeeCount: boolean;
}

export class GasConfigManager {
    private static readonly CONFIG_KEY = 'dailyReport.gasWebAppUrl';
    private static readonly TIMEOUT_KEY = 'dailyReport.gasTimeout';

    static async getGasConfig(): Promise<GasConfig | null> {
        const config = vscode.workspace.getConfiguration('dailyReport');
        let webAppUrl = config.get<string>('gasWebAppUrl');
        let timeout = config.get<number>('gasTimeout') || 10000;

        // Fallback to config.json
        if (!webAppUrl) {
            const configFromFile = this.loadConfigFromFile();
            if (configFromFile?.googleAppsScript) {
                webAppUrl = configFromFile.googleAppsScript.webAppUrl;
                timeout = configFromFile.googleAppsScript.timeout || timeout;
            }
        }

        if (!webAppUrl) {
            return null;
        }

        return {
            webAppUrl,
            timeout
        };
    }

    static async setGasUrl(url: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('dailyReport');
        await config.update('gasWebAppUrl', url, vscode.ConfigurationTarget.Workspace);
    }

    static async getCalendarConfig(): Promise<CalendarConfig> {
        const configFromFile = this.loadConfigFromFile();
        
        const defaults: CalendarConfig = {
            timeZone: 'Asia/Tokyo',
            includeAllDayEvents: true,
            includeLocation: true,
            includeAttendeeCount: true
        };

        if (configFromFile?.calendar) {
            return {
                timeZone: configFromFile.calendar.timeZone || defaults.timeZone,
                includeAllDayEvents: configFromFile.calendar.includeAllDayEvents ?? defaults.includeAllDayEvents,
                includeLocation: configFromFile.calendar.includeLocation ?? defaults.includeLocation,
                includeAttendeeCount: configFromFile.calendar.includeAttendeeCount ?? defaults.includeAttendeeCount
            };
        }

        return defaults;
    }

    private static loadConfigFromFile(): any {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return null;
            }

            const configPath = path.join(workspaceFolder.uri.fsPath, 'config', 'config.json');
            if (!fs.existsSync(configPath)) {
                return null;
            }

            const configContent = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configContent);
        } catch (error) {
            return null;
        }
    }

    static async saveConfigToFile(config: any): Promise<void> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const configDir = path.join(workspaceFolder.uri.fsPath, 'config');
            const configPath = path.join(configDir, 'config.json');

            // Ensure config directory exists
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            // Read existing config or create new one
            let existingConfig = {};
            if (fs.existsSync(configPath)) {
                try {
                    const existingContent = fs.readFileSync(configPath, 'utf8');
                    existingConfig = JSON.parse(existingContent);
                } catch (error) {
                    // If existing config is invalid, start fresh
                }
            }

            // Merge with new config
            const updatedConfig = { ...existingConfig, ...config };

            fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
        } catch (error) {
            throw new Error(`Failed to save config: ${error}`);
        }
    }

    static validateGasUrl(url: string): string | null {
        if (!url) {
            return 'URL is required';
        }

        if (!url.startsWith('https://script.google.com/macros/s/')) {
            return 'URL must be a valid Google Apps Script Web App URL starting with https://script.google.com/macros/s/';
        }

        if (!url.endsWith('/exec')) {
            return 'URL must end with /exec';
        }

        // Extract script ID for validation
        const scriptIdMatch = url.match(/\/macros\/s\/([a-zA-Z0-9_-]+)\/exec$/);
        if (!scriptIdMatch) {
            return 'Invalid Google Apps Script URL format';
        }

        return null; // Valid
    }

    static extractScriptId(url: string): string | null {
        const match = url.match(/\/macros\/s\/([a-zA-Z0-9_-]+)\/exec$/);
        return match ? match[1] : null;
    }

    static isConfigured(): boolean {
        const config = vscode.workspace.getConfiguration('dailyReport');
        const gasUrl = config.get<string>('gasWebAppUrl');
        
        if (gasUrl) {
            return true;
        }

        // Check config.json
        const configFromFile = this.loadConfigFromFile();
        return !!(configFromFile?.googleAppsScript?.webAppUrl);
    }
}