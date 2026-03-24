import type { SysMonitorConfig } from '../config/configSchema';
import type { MonitoredSystemState, SystemConnectionInput, SystemDataPoint, SystemOsInfo } from '../../shared/contracts/system';

export function listSystemsFromConfig(config: SysMonitorConfig): MonitoredSystemState[] {
    return config.systems
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((system) => ({
            connection: { ...system },
            dataPoints: [],
            recording: false,
            connected: false
        }));
}

export function activateSystemState(system: MonitoredSystemState, osInfo: SystemOsInfo): MonitoredSystemState {
    return {
        ...system,
        osInfo,
        connected: true
    };
}

export function advancePlaceholderSystemState(system: MonitoredSystemState, limit: number): MonitoredSystemState {
    const previousPoint = system.lastDataPoint;
    const now = new Date();
    const tick = now.getSeconds();

    const point: SystemDataPoint = {
        runnableProcesses: tick % 4,
        blockedProcesses: tick % 2,
        swapMemoryKB: 0,
        freeMemoryKB: 768 + (tick % 8) * 64,
        bufferMemoryKB: 256 + (tick % 6) * 32,
        cacheMemoryKB: 512 + (tick % 10) * 48,
        swapFromDiskKB: tick % 3,
        swapToDiskKB: tick % 2,
        readDiskKB: 5 + (tick % 7) * 2,
        writeDiskKB: 3 + (tick % 5) * 3,
        receivedNetworkKB: 32 + (tick % 6) * 16,
        transmittedNetworkKB: 16 + (tick % 5) * 12,
        interrupts: 100 + tick * 5,
        contextSwitches: 200 + tick * 7,
        userCPUPercent: 20 + (tick % 5) * 10,
        systemCPUPercent: 10 + (tick % 4) * 5,
        idleCPUPercent: Math.max(5, 100 - (20 + (tick % 5) * 10) - (10 + (tick % 4) * 5) - (tick % 3) * 3 - (tick % 2)),
        waitCPUPercent: (tick % 3) * 3,
        stealCPUPercent: tick % 2,
        dateTime: now.toISOString()
    };

    const nextState = addDataPointToSystemState(system, point, limit);

    return {
        ...nextState,
        connected: true,
        osInfo: nextState.osInfo ?? {
            os: 'Connecting',
            hostName: nextState.connection.hostName,
            cpuType: 'Pending',
            cpus: 0,
            memoryKB: 0,
            kernelVersion: previousPoint === undefined ? 'pending' : 'active',
            architecture: 'pending',
            vmStatPattern: 'pending'
        }
    };
}

export function addSystemToConfig(config: SysMonitorConfig, system: SystemConnectionInput): SysMonitorConfig {
    const systems = config.systems.filter((current) => current.name !== system.name);
    systems.push({ ...system });
    systems.sort((left, right) => left.name.localeCompare(right.name));

    return {
        preferences: { ...config.preferences },
        systems
    };
}

export function removeSystemFromConfig(config: SysMonitorConfig, systemName: string): SysMonitorConfig {
    return {
        preferences: { ...config.preferences },
        systems: config.systems.filter((system) => system.name !== systemName)
    };
}

export function addDataPointToSystemState(system: MonitoredSystemState, dataPoint: SystemDataPoint, limit: number): MonitoredSystemState {
    const boundedLimit = Math.max(1, limit);
    const dataPoints = [...system.dataPoints, dataPoint].slice(-boundedLimit);

    return {
        ...system,
        dataPoints,
        lastDataPoint: dataPoint,
        connected: true
    };
}
