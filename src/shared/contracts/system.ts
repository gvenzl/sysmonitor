export interface SystemConnectionInput {
    name: string;
    hostName: string;
    port: string;
    userName: string;
    passWord: string;
    sshKey: string;
}

export interface SystemPreferences {
    refreshCycle: number;
    reconnectRetries: number;
    connectTimeoutSeconds: number;
    dataPoints: number;
    recordDirPath: string;
    logDirPath: string;
}

export interface SystemOsInfo {
    os: string;
    hostName: string;
    cpuType: string;
    cpus: number;
    memoryKB: number;
    kernelVersion: string;
    architecture: string;
    vmStatPattern: string;
}

export interface SystemDataPoint {
    runnableProcesses: number;
    blockedProcesses: number;
    swapMemoryKB: number;
    freeMemoryKB: number;
    bufferMemoryKB: number;
    cacheMemoryKB: number;
    swapFromDiskKB: number;
    swapToDiskKB: number;
    readDiskKB: number;
    writeDiskKB: number;
    receivedNetworkKB: number;
    transmittedNetworkKB: number;
    interrupts: number;
    contextSwitches: number;
    userCPUPercent: number;
    systemCPUPercent: number;
    idleCPUPercent: number;
    waitCPUPercent: number;
    stealCPUPercent: number;
    dateTime: string;
}

export interface MonitoredSystemState {
    connection: SystemConnectionInput;
    osInfo?: SystemOsInfo;
    dataPoints: SystemDataPoint[];
    lastDataPoint?: SystemDataPoint;
    recording: boolean;
    connected: boolean;
}
