import type { SysMonitorDesktopApi } from '../shared/contracts/ipc';

declare global {
    interface Window {
        sysmonitor: SysMonitorDesktopApi;
    }
}

export {};
