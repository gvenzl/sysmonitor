import fs from 'node:fs/promises';
import path from 'node:path';

export function normalizeLogDirectory(logDirectory: string | null): string | null {
    if (logDirectory === null) {
        return null;
    }

    const normalized = logDirectory.trim();
    return normalized === '' ? null : normalized;
}

export function getLogFilePath(logDirectory: string): string {
    return path.join(logDirectory, 'SysMonitor.log');
}

export function renderLogLine(message: string): string {
    return message;
}

export function renderErrorLogLine(message: string): string {
    return `ERROR: ${message}`;
}

export async function appendLogLine(logDirectory: string | null, message: string): Promise<void> {
    const normalized = normalizeLogDirectory(logDirectory);
    if (normalized === null) {
        return;
    }

    await fs.mkdir(normalized, { recursive: true });
    await fs.appendFile(getLogFilePath(normalized), `${renderLogLine(message)}\n`, 'utf8');
}

export async function appendErrorLogLine(logDirectory: string | null, message: string): Promise<void> {
    const normalized = normalizeLogDirectory(logDirectory);
    if (normalized === null) {
        return;
    }

    await fs.mkdir(normalized, { recursive: true });
    await fs.appendFile(getLogFilePath(normalized), `${renderErrorLogLine(message)}\n`, 'utf8');
}
