import * as vscode from 'vscode';
import { DateUtils } from '../utils/dateUtils';

export interface CalendarEvent {
    title: string;
    startTime: string;
    endTime: string;
    location: string;
    attendees: number;
    isAllDay: boolean;
}

export interface GasResponse {
    success: boolean;
    date: string;
    events?: CalendarEvent[];
    error?: string;
}

export class GasService {
    private gasUrl: string | null = null;

    constructor() {
        this.loadGasUrl();
    }

    private loadGasUrl(): void {
        const config = vscode.workspace.getConfiguration('dailyReport');
        this.gasUrl = config.get<string>('gasWebAppUrl') || null;
        
        // Also try loading from config.json
        if (!this.gasUrl) {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    const fs = require('fs');
                    const path = require('path');
                    const configPath = path.join(workspaceFolder.uri.fsPath, 'config', 'config.json');
                    if (fs.existsSync(configPath)) {
                        const configContent = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                        this.gasUrl = configContent.googleAppsScript?.webAppUrl;
                    }
                }
            } catch (error) {
                // Ignore config.json errors
            }
        }
    }

    async getTodaysEvents(): Promise<CalendarEvent[]> {
        const today = DateUtils.getTodayDateString();
        return this.getEventsForDate(today);
    }

    async getEventsForDate(date: string): Promise<CalendarEvent[]> {
        if (!this.gasUrl) {
            throw new Error('Google Apps Script URL is not configured. Please run "Configure Google Apps Script URL" command first.');
        }

        try {
            // First, try to open the GAS URL in browser for authentication
            const url = `${this.gasUrl}?date=${encodeURIComponent(date)}`;
            
            // Show message and open browser for authentication
            const authChoice = await vscode.window.showInformationMessage(
                'Google Apps Script authentication required. Click "Open Browser" to authenticate and get calendar data.',
                'Open Browser', 'Cancel'
            );
            
            if (authChoice !== 'Open Browser') {
                throw new Error('Authentication cancelled by user');
            }
            
            // Open URL in browser for authentication
            await vscode.env.openExternal(vscode.Uri.parse(url));
            
            // Add delay to ensure browser opens
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show instructions and wait for JSON response
            await vscode.window.showInformationMessage(
                'Browser opened. After completing authentication, you will see JSON data. Copy the entire JSON response.',
                'OK'
            );
            
            // Wait for user to complete authentication and copy the JSON response
            const jsonResponse = await vscode.window.showInputBox({
                title: 'Paste JSON Response',
                prompt: 'Paste the complete JSON response from the browser here',
                placeHolder: 'Paste JSON here: {"success": true, "date": "2024-01-15", "events": [...]}',
                ignoreFocusOut: true,
                validateInput: (value) => {
                    if (!value || value.trim() === '') {
                        return 'JSON response is required';
                    }
                    try {
                        const parsed = JSON.parse(value.trim());
                        if (!parsed.hasOwnProperty('success')) {
                            return 'Invalid response format - missing "success" field';
                        }
                        return null;
                    } catch (error) {
                        return 'Invalid JSON format - please copy the complete response from browser';
                    }
                }
            });
            
            if (!jsonResponse) {
                throw new Error('No JSON response provided');
            }

            let data: GasResponse;
            try {
                data = JSON.parse(jsonResponse) as GasResponse;
            } catch (parseError) {
                throw new Error(`Invalid JSON response: ${parseError}`);
            }

            if (!data.success) {
                throw new Error(data.error || 'Unknown error from Google Apps Script');
            }

            return data.events || [];

        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout: Google Apps Script took too long to respond');
                } else if (error.name === 'TypeError') {
                    throw new Error('Network error: Could not connect to Google Apps Script');
                }
                throw error;
            }
            throw new Error('Unknown error occurred while fetching calendar events');
        }
    }

    async configureGasUrl(): Promise<void> {
        const currentUrl = this.gasUrl || '';
        
        const newUrl = await vscode.window.showInputBox({
            prompt: 'Enter your Google Apps Script Web App URL',
            placeHolder: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
            value: currentUrl,
            validateInput: (value) => {
                if (!value) {
                    return 'URL is required';
                }
                if (!value.startsWith('https://script.google.com/macros/s/')) {
                    return 'URL must be a valid Google Apps Script Web App URL';
                }
                return null;
            }
        });

        if (newUrl) {
            this.gasUrl = newUrl;
            
            // Save to VSCode settings
            const config = vscode.workspace.getConfiguration('dailyReport');
            await config.update('gasWebAppUrl', newUrl, vscode.ConfigurationTarget.Workspace);
            
            vscode.window.showInformationMessage('Google Apps Script URL configured successfully!');
        }
    }

    isConfigured(): boolean {
        return this.gasUrl !== null && this.gasUrl.length > 0;
    }

    getConfiguredUrl(): string | null {
        return this.gasUrl;
    }

    async testConnection(): Promise<boolean> {
        try {
            const events = await this.getTodaysEvents();
            vscode.window.showInformationMessage(`Connection successful! Found ${events.length} events for today.`);
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Connection failed: ${error}`);
            return false;
        }
    }
}