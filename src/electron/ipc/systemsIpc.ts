import { BrowserWindow, ipcMain } from 'electron';

import { readConfigFromDisk, writeConfigToDisk } from '../../core/config/configRepository';
import { retrieveOsInfo, readNetworkSample, readVmstatSample } from '../../core/ssh/connection';
import { activateSystemState, addDataPointToSystemState, addSystemToConfig, listSystemsFromConfig, removeSystemFromConfig } from '../../core/systems/systemsStore';
import { calculateNetworkRates, parseNetworkCounters, parseVmstatLine } from '../../core/vmstat/vmstatParser';
import type { MonitoredSystemState, SystemConnectionInput } from '../../shared/contracts/system';
import { IPC_CHANNELS } from '../../shared/contracts/ipc';

const activeSystems = new Map<string, MonitoredSystemState>();
const previousNetworkCounters = new Map<string, { receivedBytes: number; transmittedBytes: number; capturedAt: number }>();
let tickHandle: NodeJS.Timeout | undefined;
let tickIntervalMs = 1000;

function buildPlaceholderState(system: MonitoredSystemState, dataPointLimit: number): MonitoredSystemState {
    const now = new Date();
    const point = {
        runnableProcesses: 0,
        blockedProcesses: 0,
        swapMemoryKB: 0,
        freeMemoryKB: 0,
        bufferMemoryKB: 0,
        cacheMemoryKB: 0,
        swapFromDiskKB: 0,
        swapToDiskKB: 0,
        readDiskKB: 0,
        writeDiskKB: 0,
        receivedNetworkKB: 0,
        transmittedNetworkKB: 0,
        interrupts: 0,
        contextSwitches: 0,
        userCPUPercent: 0,
        systemCPUPercent: 0,
        idleCPUPercent: 100,
        waitCPUPercent: 0,
        stealCPUPercent: 0,
        dateTime: now.toISOString()
    };

    return addDataPointToSystemState(activateSystemState(system, {
        os: 'Connecting',
        hostName: system.connection.hostName,
        cpuType: 'Pending',
        cpus: 0,
        memoryKB: 0,
        kernelVersion: 'pending',
        architecture: 'pending',
        vmStatPattern: 'pending'
    }), point, dataPointLimit);
}

function getSortedSystems(): MonitoredSystemState[] {
    return Array.from(activeSystems.values()).sort((left, right) => left.connection.name.localeCompare(right.connection.name));
}

function broadcastSystemsUpdated(): void {
    const systems = getSortedSystems();
    for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send(IPC_CHANNELS.systemsUpdated, systems);
    }
}

async function tickSystems(): Promise<void> {
    const config = await readConfigFromDisk();
    const limit = config.preferences.dataPoints;

    for (const [name, systemSnapshot] of activeSystems.entries()) {
        try {
            const currentSystem = activeSystems.get(name) ?? systemSnapshot;

            if (currentSystem.osInfo === undefined || currentSystem.osInfo.vmStatPattern === 'pending') {
                const osInfo = await retrieveOsInfo(currentSystem.connection);
                activeSystems.set(name, activateSystemState(currentSystem, osInfo));
                continue;
            }

            const [line, networkRaw] = await Promise.all([
                readVmstatSample(currentSystem.connection),
                readNetworkSample(currentSystem.connection)
            ]);
            const latestSystem = activeSystems.get(name) ?? currentSystem;
            if (latestSystem.osInfo === undefined) {
                continue;
            }

            const dataPoint = parseVmstatLine(line, latestSystem.osInfo.vmStatPattern);
            const counters = parseNetworkCounters(networkRaw);
            const previousCounters = previousNetworkCounters.get(name);
            const capturedAt = Date.now();
            previousNetworkCounters.set(name, { ...counters, capturedAt });

            if (previousCounters === undefined) {
                continue;
            }

            const elapsedSeconds = Math.max(0.001, (capturedAt - previousCounters.capturedAt) / 1000);
            const rates = calculateNetworkRates(previousCounters, counters, elapsedSeconds);
            dataPoint.receivedNetworkKB = rates.receivedNetworkKB;
            dataPoint.transmittedNetworkKB = rates.transmittedNetworkKB;
            activeSystems.set(name, addDataPointToSystemState(latestSystem, dataPoint, limit));
        }
        catch {
            const latestSystem = activeSystems.get(name) ?? systemSnapshot;
            activeSystems.set(name, {
                ...latestSystem,
                connected: false
            });
        }
    }

    broadcastSystemsUpdated();
}

function ensureTicker(refreshCycleSeconds: number): void {
    const nextIntervalMs = Math.max(1000, refreshCycleSeconds * 1000);

    if (tickHandle !== undefined && nextIntervalMs === tickIntervalMs) {
        return;
    }

    if (tickHandle !== undefined) {
        clearInterval(tickHandle);
    }

    tickIntervalMs = nextIntervalMs;
    tickHandle = setInterval(() => {
        void tickSystems();
    }, tickIntervalMs);
}

async function hydrateSystemsFromConfig(): Promise<MonitoredSystemState[]> {
    const config = await readConfigFromDisk();
    const systems = listSystemsFromConfig(config).map((system) => buildPlaceholderState(system, config.preferences.dataPoints));
    activeSystems.clear();
    systems.forEach((system) => {
        activeSystems.set(system.connection.name, system);
    });
    ensureTicker(config.preferences.refreshCycle);
    broadcastSystemsUpdated();
    return systems;
}

export function registerSystemsIpcHandlers(): void {
    ipcMain.handle(IPC_CHANNELS.listSystems, async () => {
        if (activeSystems.size === 0) {
            return hydrateSystemsFromConfig();
        }

        return getSortedSystems();
    });

    ipcMain.handle(IPC_CHANNELS.addSystem, async (_event, system: SystemConnectionInput) => {
        const config = await readConfigFromDisk();
        const updatedConfig = addSystemToConfig(config, system);
        await writeConfigToDisk(updatedConfig);

        const placeholderState = buildPlaceholderState({
            connection: { ...system },
            dataPoints: [],
            recording: false,
            connected: false
        }, updatedConfig.preferences.dataPoints);
        activeSystems.set(system.name, placeholderState);
        ensureTicker(updatedConfig.preferences.refreshCycle);
        broadcastSystemsUpdated();
    });

    ipcMain.handle(IPC_CHANNELS.removeSystem, async (_event, systemName: string) => {
        const config = await readConfigFromDisk();
        const updatedConfig = removeSystemFromConfig(config, systemName);
        await writeConfigToDisk(updatedConfig);
        activeSystems.delete(systemName);
        previousNetworkCounters.delete(systemName);
        broadcastSystemsUpdated();
    });
}
