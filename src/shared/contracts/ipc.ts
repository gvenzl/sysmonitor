import type { AppMetadata } from './app';
import type { SysMonitorConfig } from '../../core/config/configSchema';
import type { MonitoredSystemState, SystemConnectionInput } from './system';

export const IPC_CHANNELS = {
    getAppMetadata: 'app:getMetadata',
    getConfig: 'config:get',
    saveConfig: 'config:save',
    listSystems: 'systems:list',
    addSystem: 'systems:add',
    removeSystem: 'systems:remove',
    openSshKeyFile: 'systems:openSshKeyFile',
    rendererCommand: 'renderer-command',
    systemsUpdated: 'systems:updated'
} as const;

export interface RendererCommandSubscription {
    unsubscribe(): void;
}

export interface SystemsSubscription {
    unsubscribe(): void;
}

export type RendererCommand = 'system:new' | 'system:preferences';

export interface SysMonitorDesktopApi {
    getAppMetadata(): Promise<AppMetadata>;
    getConfig(): Promise<SysMonitorConfig>;
    saveConfig(config: SysMonitorConfig): Promise<void>;
    listSystems(): Promise<MonitoredSystemState[]>;
    addSystem(system: SystemConnectionInput): Promise<void>;
    removeSystem(systemName: string): Promise<void>;
    openSshKeyFile(): Promise<string | null>;
    onRendererCommand(listener: (command: RendererCommand) => void): RendererCommandSubscription;
    onSystemsUpdated(listener: (systems: MonitoredSystemState[]) => void): SystemsSubscription;
}
