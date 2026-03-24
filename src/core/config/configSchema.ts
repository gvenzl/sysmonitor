export interface ConfigSystem {
    name: string;
    hostName: string;
    port: string;
    userName: string;
    passWord: string;
    sshKey: string;
}

export type ThemeMode = 'dark' | 'light';

export interface ConfigPreferences {
    themeMode: ThemeMode;
    refreshCycle: number;
    reconnectRetries: number;
    connectTimeoutSeconds: number;
    dataPoints: number;
    recordDirPath: string;
    logDirPath: string;
}

export interface SysMonitorConfig {
    preferences: ConfigPreferences;
    systems: ConfigSystem[];
}

export const DEFAULT_CONFIG_PREFERENCES: ConfigPreferences = {
    themeMode: 'dark',
    refreshCycle: 1,
    reconnectRetries: 3,
    connectTimeoutSeconds: 5,
    dataPoints: 30,
    recordDirPath: '',
    logDirPath: ''
};
