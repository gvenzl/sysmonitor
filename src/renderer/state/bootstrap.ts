import type { AppMetadata } from '../../shared/contracts/app';
import type { SysMonitorConfig } from '../../core/config/configSchema';
import type { MonitoredSystemState, SystemConnectionInput } from '../../shared/contracts/system';
import type { RendererCommand, SysMonitorDesktopApi } from '../../shared/contracts/ipc';

export interface BootstrapState {
    metadata: AppMetadata;
    config: SysMonitorConfig;
    systems: MonitoredSystemState[];
}

export interface AddSystemAction {
    system: SystemConnectionInput;
}

export interface RemoveSystemAction {
    systemName: string;
}

export interface SavePreferencesAction {
    config: SysMonitorConfig;
}

export function getDesktopApi(): SysMonitorDesktopApi {
    if (window.sysmonitor === undefined) {
        throw new Error('SysMonitor desktop bridge is unavailable. Verify that the Electron preload script loaded correctly.');
    }

    return window.sysmonitor;
}

export async function loadBootstrapState(): Promise<BootstrapState> {
    const desktopApi = getDesktopApi();
    const [metadata, config, systems] = await Promise.all([
        desktopApi.getAppMetadata(),
        desktopApi.getConfig(),
        desktopApi.listSystems()
    ]);

    return {
        metadata,
        config,
        systems
    };
}

export async function submitSystem(action: AddSystemAction): Promise<BootstrapState> {
    const desktopApi = getDesktopApi();
    await desktopApi.addSystem(action.system);
    return loadBootstrapState();
}

export async function removeSystem(action: RemoveSystemAction): Promise<BootstrapState> {
    const desktopApi = getDesktopApi();
    await desktopApi.removeSystem(action.systemName);
    return loadBootstrapState();
}

export async function savePreferences(action: SavePreferencesAction): Promise<BootstrapState> {
    const desktopApi = getDesktopApi();
    await desktopApi.saveConfig(action.config);
    return loadBootstrapState();
}

export function subscribeToRendererCommands(listener: (command: RendererCommand) => void): () => void {
    const desktopApi = getDesktopApi();
    return desktopApi.onRendererCommand(listener);
}

export async function openSshKeyFile(): Promise<string | null> {
    const desktopApi = getDesktopApi();
    return desktopApi.openSshKeyFile();
}

export async function refreshBootstrapState(): Promise<BootstrapState> {
    return loadBootstrapState();
}
