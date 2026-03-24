import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export interface RecordingPathOptions {
    basePath: string;
    prefix: string;
    systemName: string;
}

export interface RecordingHeaderOptions {
    connectionName: string;
    systemName: string;
    cpuCount: string;
    memoryGb: string;
    osName: string;
    architecture: string;
    osVersion: string;
    vmstatHeaders: string;
}

export interface RecordDirectoryValidationResult {
    valid: boolean;
    reason?: string;
}

export function getEffectiveRecordDirectory(basePath: string): string {
    return basePath.trim() === '' ? os.homedir() : basePath;
}

export function buildRecordingPath(options: RecordingPathOptions): string {
    const fileName = `${options.prefix.trim() === '' ? '' : options.prefix}${options.systemName}.log`;
    return path.join(getEffectiveRecordDirectory(options.basePath), fileName);
}

export function buildRecordingHeader(options: RecordingHeaderOptions): string {
    return [
        `Name: ${options.connectionName}    System: ${options.systemName}    CPUs: ${options.cpuCount}    Memory(GBs): ${options.memoryGb}`,
        `OS: ${options.osName}    Architecture: ${options.architecture}    OSVersion: ${options.osVersion}`,
        options.vmstatHeaders
    ].join('\n');
}

export async function validateRecordDirectory(directoryPath: string): Promise<RecordDirectoryValidationResult> {
    try {
        const stats = await fs.stat(directoryPath);
        if (!stats.isDirectory()) {
            return {
                valid: false,
                reason: `Directory '${directoryPath}' is not a directory.`
            };
        }

        await fs.access(directoryPath, fs.constants.W_OK);
        return { valid: true };
    }
    catch {
        return {
            valid: false,
            reason: `Directory '${directoryPath}' is not a directory.`
        };
    }
}
