/* 
 * Sistema de Logs Aprimorado - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-21 20:52
 * @version 1.1.0
 */

import { APP_VERSION } from '../config';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: unknown;
    action?: string;
    component?: string;
    version: string;
}

const LOG_STORAGE_KEY = 'palma_psd_logs';
const MAX_LOGS = 500;

function generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getStoredLogs(): LogEntry[] {
    try {
        const stored = localStorage.getItem(LOG_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveLogs(logs: LogEntry[]): void {
    try {
        const trimmed = logs.slice(-MAX_LOGS);
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
        console.error('[Logger] Falha ao salvar logs:', error);
    }
}

function createLogEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
    action?: string,
    component?: string
): LogEntry {
    return {
        id: generateLogId(),
        timestamp: new Date().toISOString(),
        level,
        message,
        data,
        action,
        component,
        version: APP_VERSION
    };
}

function addLog(entry: LogEntry): void {
    const logs = getStoredLogs();
    logs.push(entry);
    saveLogs(logs);

    const isDev = import.meta.env.DEV;
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    const componentInfo = entry.component ? ` [${entry.component}]` : '';
    const actionInfo = entry.action ? ` (${entry.action})` : '';

    const consoleMessage = `${prefix}${componentInfo}${actionInfo} - ${entry.message}`;

    switch (entry.level) {
        case 'error':
            console.error(consoleMessage, entry.data || '');
            break;
        case 'warn':
            if (isDev) console.warn(consoleMessage, entry.data || '');
            break;
        case 'info':
            if (isDev) console.log(consoleMessage, entry.data || '');
            break;
        case 'debug':
            if (isDev) console.debug(consoleMessage, entry.data || '');
            break;
    }
}

export const Logger = {
    info: (message: string, data?: unknown, component?: string, action?: string) => {
        addLog(createLogEntry('info', message, data, action, component));
    },

    warn: (message: string, data?: unknown, component?: string, action?: string) => {
        addLog(createLogEntry('warn', message, data, action, component));
    },

    error: (message: string, data?: unknown, component?: string, action?: string) => {
        addLog(createLogEntry('error', message, data, action, component));
    },

    debug: (message: string, data?: unknown, component?: string, action?: string) => {
        addLog(createLogEntry('debug', message, data, action, component));
    },

    getLogs: (level?: LogLevel, limit?: number): LogEntry[] => {
        let logs = getStoredLogs();
        
        if (level) {
            logs = logs.filter(log => log.level === level);
        }
        
        if (limit) {
            logs = logs.slice(-limit);
        }
        
        return logs;
    },

    getRecentErrors: (limit: number = 10): LogEntry[] => {
        return Logger.getLogs('error', limit);
    },

    clearLogs: (): void => {
        try {
            localStorage.removeItem(LOG_STORAGE_KEY);
            Logger.info('Logs limpos', undefined, 'Logger', 'clearLogs');
        } catch (error) {
            console.error('[Logger] Falha ao limpar logs:', error);
        }
    },

    exportLogs: (): string => {
        const logs = getStoredLogs();
        return JSON.stringify(logs, null, 2);
    },

    getLogStats: (): { total: number; byLevel: Record<LogLevel, number> } => {
        const logs = getStoredLogs();
        const byLevel: Record<LogLevel, number> = {
            info: 0,
            warn: 0,
            error: 0,
            debug: 0
        };

        logs.forEach(log => {
            byLevel[log.level]++;
        });

        return { total: logs.length, byLevel };
    }
};

export const logger = {
    info: (message: string, data?: unknown) => Logger.info(message, data),
    warn: (message: string, data?: unknown) => Logger.warn(message, data),
    error: (message: string, error?: unknown) => Logger.error(message, error)
};
