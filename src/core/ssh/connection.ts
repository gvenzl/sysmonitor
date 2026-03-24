import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import type { SystemConnectionInput, SystemOsInfo } from '../../shared/contracts/system';
import { parseVmstatHeaderPattern } from '../vmstat/vmstatParser';

const execFileAsync = promisify(execFile);

export function buildBaseSshArgs(system: SystemConnectionInput): string[] {
    const args = [
        '-o', 'BatchMode=yes',
        '-p', system.port || '22'
    ];

    if (system.sshKey.trim() !== '') {
        args.push('-i', system.sshKey.trim());
    }

    return args;
}

async function runRemoteCommand(system: SystemConnectionInput, command: string): Promise<string> {
    const target = `${system.userName}@${system.hostName}`;
    const args = [...buildBaseSshArgs(system), target, command];
    const { stdout } = await execFileAsync('/usr/bin/ssh', args, { timeout: 10000, maxBuffer: 1024 * 1024 });
    return stdout.trim();
}

export async function retrieveOsInfo(system: SystemConnectionInput): Promise<SystemOsInfo> {
    const [hostName, architecture, os, kernelVersion, cpusRaw, cpuType, memoryRaw, vmstatOutput] = await Promise.all([
        runRemoteCommand(system, 'hostname'),
        runRemoteCommand(system, 'uname -m'),
        runRemoteCommand(system, 'uname -s'),
        runRemoteCommand(system, 'uname -r'),
        runRemoteCommand(system, "grep processor /proc/cpuinfo | wc -l"),
        runRemoteCommand(system, "grep 'model name' /proc/cpuinfo | head -n 1 | awk -F ':' '{print $2}' | xargs"),
        runRemoteCommand(system, "awk '/MemTotal/ {print $2}' /proc/meminfo"),
        runRemoteCommand(system, 'vmstat')
    ]);

    return {
        hostName,
        architecture,
        os,
        kernelVersion,
        cpus: Number.parseInt(cpusRaw, 10),
        cpuType,
        memoryKB: Number.parseInt(memoryRaw, 10),
        vmStatPattern: parseVmstatHeaderPattern(vmstatOutput)
    };
}

export async function readVmstatSample(system: SystemConnectionInput): Promise<string> {
    return runRemoteCommand(system, 'vmstat -tn 1 2 | tail -n 1');
}

export async function readNetworkSample(system: SystemConnectionInput): Promise<string> {
    return runRemoteCommand(system, "cat /proc/net/dev | grep -v 'lo:'");
}
