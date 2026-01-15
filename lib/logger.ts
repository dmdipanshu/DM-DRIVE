import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'logs.txt');

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function formatDate(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

function writeLog(level: LogLevel, message: string, data?: any): void {
    const timestamp = formatDate(new Date());
    let logLine = `[${timestamp}] [${level}] ${message}`;

    if (data) {
        if (data instanceof Error) {
            logLine += ` | Error: ${data.message}`;
        } else if (typeof data === 'object') {
            try {
                logLine += ` | ${JSON.stringify(data)}`;
            } catch {
                logLine += ` | [Object]`;
            }
        } else {
            logLine += ` | ${data}`;
        }
    }

    logLine += '\n';

    // Also log to console
    console.log(logLine.trim());

    // Append to file
    try {
        fs.appendFileSync(LOG_FILE, logLine);
    } catch (err) {
        console.error('Failed to write log:', err);
    }
}

export const logger = {
    info: (message: string, data?: any) => writeLog('INFO', message, data),
    warn: (message: string, data?: any) => writeLog('WARN', message, data),
    error: (message: string, data?: any) => writeLog('ERROR', message, data),
    debug: (message: string, data?: any) => writeLog('DEBUG', message, data),

    // Log API request
    request: (method: string, path: string, userId?: string) => {
        writeLog('INFO', `${method} ${path}`, userId ? { userId } : undefined);
    },

    // Log upload
    upload: (filename: string, size: number, success: boolean, error?: string) => {
        if (success) {
            writeLog('INFO', `UPLOAD SUCCESS: ${filename} (${(size / 1024).toFixed(1)} KB)`);
        } else {
            writeLog('ERROR', `UPLOAD FAILED: ${filename}`, error);
        }
    },

    // Log download
    download: (filename: string, userId?: string) => {
        writeLog('INFO', `DOWNLOAD: ${filename}`, userId ? { userId } : undefined);
    },

    // Log auth
    auth: (action: string, email: string, success: boolean) => {
        if (success) {
            writeLog('INFO', `AUTH ${action}: ${email}`);
        } else {
            writeLog('WARN', `AUTH ${action} FAILED: ${email}`);
        }
    }
};

export default logger;
