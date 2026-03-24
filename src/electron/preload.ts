import { contextBridge, ipcRenderer } from 'electron';

import { IPC_CHANNELS, type RendererCommand, type RendererCommandSubscription, type SysMonitorDesktopApi, type SystemsSubscription } from '../shared/contracts/ipc';
import type { AppMetadata } from '../shared/contracts/app';
import type { SysMonitorConfig } from '../core/config/configSchema';
import type { MonitoredSystemState, SystemConnectionInput } from '../shared/contracts/system';

const api: SysMonitorDesktopApi = {
    getAppMetadata: async (): Promise<AppMetadata> => ipcRenderer.invoke(IPC_CHANNELS.getAppMetadata),
    getConfig: async (): Promise<SysMonitorConfig> => ipcRenderer.invoke(IPC_CHANNELS.getConfig),
    saveConfig: async (config: SysMonitorConfig): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.saveConfig, config),
    listSystems: async (): Promise<MonitoredSystemState[]> => ipcRenderer.invoke(IPC_CHANNELS.listSystems),
    addSystem: async (system: SystemConnectionInput): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.addSystem, system),
    removeSystem: async (systemName: string): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.removeSystem, systemName),
    openSshKeyFile: async (): Promise<string | null> => ipcRenderer.invoke(IPC_CHANNELS.openSshKeyFile),
    onRendererCommand: (listener: (command: RendererCommand) => void): RendererCommandSubscription => {
        const handler = (_event: Electron.IpcRendererEvent, command: RendererCommand): void => {
            listener(command);
        };

        ipcRenderer.on(IPC_CHANNELS.rendererCommand, handler);

        return {
            unsubscribe(): void {
                ipcRenderer.removeListener(IPC_CHANNELS.rendererCommand, handler);
            }
        };
    },
    onSystemsUpdated: (listener: (systems: MonitoredSystemState[]) => void): SystemsSubscription => {
        const handler = (_event: Electron.IpcRendererEvent, systems: MonitoredSystemState[]): void => {
            listener(systems);
        };

        ipcRenderer.on(IPC_CHANNELS.systemsUpdated, handler);

        return {
            unsubscribe(): void {
                ipcRenderer.removeListener(IPC_CHANNELS.systemsUpdated, handler);
            }
        };
    }
};

contextBridge.exposeInMainWorld('sysmonitor', api);
