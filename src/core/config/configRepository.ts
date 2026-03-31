import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { DEFAULT_CONFIG_PREFERENCES, type SysMonitorConfig } from './configSchema';

const OBFUSCATED_PASSWORD_PREFIX = 'obf:';

export function getConfigDirectory(): string {
    return path.join(os.homedir(), '.sysmonitor');
}

export function getConfigFilePath(): string {
    return path.join(getConfigDirectory(), 'config.json');
}

export function obfuscatePassword(password: string): string {
    if (password === '') {
        return '';
    }

    if (password.startsWith(OBFUSCATED_PASSWORD_PREFIX)) {
        return password;
    }

    return `${OBFUSCATED_PASSWORD_PREFIX}${Buffer.from(password, 'utf8').toString('base64')}`;
}

export function createDefaultConfig(): SysMonitorConfig {
    return {
        preferences: { ...DEFAULT_CONFIG_PREFERENCES },
        systems: []
    };
}

export function normalizeConfig(raw: Partial<SysMonitorConfig> | undefined): SysMonitorConfig {
    return {
        preferences: {
            ...DEFAULT_CONFIG_PREFERENCES,
            ...(raw?.preferences ?? {}),
            themeMode: raw?.preferences?.themeMode === 'light' ? 'light' : 'dark'
        },
        systems: (raw?.systems ?? []).map((system) => ({
            name: system.name ?? '',
            hostName: system.hostName ?? '',
            port: system.port ?? '22',
            userName: system.userName ?? '',
            passWord: obfuscatePassword(system.passWord ?? ''),
            sshKey: system.sshKey ?? ''
        }))
    };
}

export async function readConfigFromDisk(filePath: string = getConfigFilePath()): Promise<SysMonitorConfig> {
    try {
        const json = await fs.readFile(filePath, 'utf8');
        if (json.trim() === '') {
            return createDefaultConfig();
        }

        return normalizeConfig(JSON.parse(json) as Partial<SysMonitorConfig>);
    }
    catch (error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'ENOENT') {
            return createDefaultConfig();
        }
        throw error;
    }
}

export async function writeConfigToDisk(config: SysMonitorConfig, filePath: string = getConfigFilePath()): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(normalizeConfig(config), null, 2)}
`, 'utf8');
}
