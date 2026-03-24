import type { SystemDataPoint } from '../../shared/contracts/system';

export function parseVmstatHeaderPattern(vmstatOutput: string): string {
    const hasGuest = vmstatOutput.split('\n').some((line) => line.includes(' gu'));

    if (hasGuest) {
        return ' *(?<runQueue>\\d+) *(?<blockedQueue>\\d+) *(?<swapMemory>\\d+) *(?<freeMemory>\\d+) *(?<buffersMemory>\\d+) *(?<cacheMemory>\\d+) *(?<swappedFromDisk>\\d+) *(?<swappedToDisk>\\d+) *(?<kbFromDisk>\\d+) *(?<kbToDisk>\\d+) *(?<interruptsPerSec>\\d+) *(?<contextSwitchesPerSec>\\d+) *(?<userCPU>\\d+) *(?<systemCPU>\\d+) *(?<idleCPU>\\d+) *(?<waitCPU>\\d+) *(?<stealCPU>\\d+) *(?<guestCPU>\\d+) *(?<tms>\\d\\d\\d\\d-\\d\\d-\\d\\d \\d\\d:\\d\\d:\\d\\d)';
    }

    return ' *(?<runQueue>\\d+) *(?<blockedQueue>\\d+) *(?<swapMemory>\\d+) *(?<freeMemory>\\d+) *(?<buffersMemory>\\d+) *(?<cacheMemory>\\d+) *(?<swappedFromDisk>\\d+) *(?<swappedToDisk>\\d+) *(?<kbFromDisk>\\d+) *(?<kbToDisk>\\d+) *(?<interruptsPerSec>\\d+) *(?<contextSwitchesPerSec>\\d+) *(?<userCPU>\\d+) *(?<systemCPU>\\d+) *(?<idleCPU>\\d+) *(?<waitCPU>\\d+) *(?<stealCPU>\\d+) *(?<tms>\\d\\d\\d\\d-\\d\\d-\\d\\d \\d\\d:\\d\\d:\\d\\d)';
}

export function parseVmstatLine(line: string, vmstatPattern: string): SystemDataPoint {
    const pattern = new RegExp(vmstatPattern);
    const matcher = pattern.exec(line);

    if (matcher?.groups === undefined) {
        throw new Error(`Cannot parse vmstat line: ${line}`);
    }

    return {
        runnableProcesses: Number.parseInt(matcher.groups.runQueue, 10),
        blockedProcesses: Number.parseInt(matcher.groups.blockedQueue, 10),
        swapMemoryKB: Number.parseInt(matcher.groups.swapMemory, 10),
        freeMemoryKB: Number.parseInt(matcher.groups.freeMemory, 10),
        bufferMemoryKB: Number.parseInt(matcher.groups.buffersMemory, 10),
        cacheMemoryKB: Number.parseInt(matcher.groups.cacheMemory, 10),
        swapFromDiskKB: Number.parseInt(matcher.groups.swappedFromDisk, 10),
        swapToDiskKB: Number.parseInt(matcher.groups.swappedToDisk, 10),
        readDiskKB: Number.parseInt(matcher.groups.kbFromDisk, 10),
        writeDiskKB: Number.parseInt(matcher.groups.kbToDisk, 10),
        receivedNetworkKB: 0,
        transmittedNetworkKB: 0,
        interrupts: Number.parseInt(matcher.groups.interruptsPerSec, 10),
        contextSwitches: Number.parseInt(matcher.groups.contextSwitchesPerSec, 10),
        userCPUPercent: Number.parseInt(matcher.groups.userCPU, 10),
        systemCPUPercent: Number.parseInt(matcher.groups.systemCPU, 10),
        idleCPUPercent: Number.parseInt(matcher.groups.idleCPU, 10),
        waitCPUPercent: Number.parseInt(matcher.groups.waitCPU, 10),
        stealCPUPercent: Number.parseInt(matcher.groups.stealCPU, 10),
        dateTime: matcher.groups.tms.replace(' ', 'T') + 'Z'
    };
}

export interface NetworkCounters {
    receivedBytes: number;
    transmittedBytes: number;
}

export function parseNetworkCounters(raw: string): NetworkCounters {
    const lines = raw.split('\n').map((line) => line.trim()).filter((line) => line !== '');

    let receivedBytes = 0;
    let transmittedBytes = 0;

    for (const line of lines) {
        const [iface, payload] = line.split(':');
        if (iface === undefined || payload === undefined) {
            continue;
        }

        const fields = payload.trim().split(/\s+/);
        if (fields.length < 16) {
            continue;
        }

        receivedBytes += Number.parseInt(fields[0], 10);
        transmittedBytes += Number.parseInt(fields[8], 10);
    }

    return {
        receivedBytes,
        transmittedBytes
    };
}

export function calculateNetworkRates(previous: NetworkCounters, next: NetworkCounters, elapsedSeconds: number): { receivedNetworkKB: number; transmittedNetworkKB: number } {
    const safeElapsed = Math.max(0.001, elapsedSeconds);

    return {
        receivedNetworkKB: Math.max(0, Math.round((next.receivedBytes - previous.receivedBytes) / 1024 / safeElapsed)),
        transmittedNetworkKB: Math.max(0, Math.round((next.transmittedBytes - previous.transmittedBytes) / 1024 / safeElapsed))
    };
}
