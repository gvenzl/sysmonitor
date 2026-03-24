import { dialog, ipcMain } from 'electron';

import { type SysMonitorConfig } from '../../core/config/configSchema';
import { readConfigFromDisk, writeConfigToDisk } from '../../core/config/configRepository';
import type { AppMetadata } from '../../shared/contracts/app';
import { IPC_CHANNELS } from '../../shared/contracts/ipc';

export interface ConfigIpcDependencies {
    getAppMetadata: () => AppMetadata;
}

export function registerConfigIpcHandlers(dependencies: ConfigIpcDependencies): void {
    ipcMain.handle(IPC_CHANNELS.getAppMetadata, async () => dependencies.getAppMetadata());
    ipcMain.handle(IPC_CHANNELS.getConfig, async () => readConfigFromDisk());
    ipcMain.handle(IPC_CHANNELS.saveConfig, async (_event, config: SysMonitorConfig) => {
        await writeConfigToDisk(config);
    });
    ipcMain.handle(IPC_CHANNELS.openSshKeyFile, async () => {
        const result = await dialog.showOpenDialog({
            title: 'Open SSH Key',
            properties: ['openFile']
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0];
    });
}
