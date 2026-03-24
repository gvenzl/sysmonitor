import { describe, expect, it } from 'vitest';

import type { SysMonitorConfig } from '../../../src/core/config/configSchema';
import type { MonitoredSystemState, SystemDataPoint } from '../../../src/shared/contracts/system';
import { activateSystemState, addDataPointToSystemState, addSystemToConfig, advancePlaceholderSystemState, listSystemsFromConfig, removeSystemFromConfig } from '../../../src/core/systems/systemsStore';

describe('systemsStore', () => {
  it('lists persisted systems as monitored-system state records', () => {
    const config: SysMonitorConfig = {
      preferences: {
        refreshCycle: 1,
        reconnectRetries: 3,
        connectTimeoutSeconds: 5,
        dataPoints: 30,
        recordDirPath: '',
        logDirPath: ''
      },
      systems: [
        {
          name: 'Database',
          hostName: 'db.example.com',
          port: '22',
          userName: 'oracle',
          passWord: 'secret',
          sshKey: ''
        }
      ]
    };

    expect(listSystemsFromConfig(config)).toEqual([
      {
        connection: {
          name: 'Database',
          hostName: 'db.example.com',
          port: '22',
          userName: 'oracle',
          passWord: 'secret',
          sshKey: ''
        },
        dataPoints: [],
        recording: false,
        connected: false
      }
    ]);
  });

  it('marks a system active when monitoring starts', () => {
    const [system] = listSystemsFromConfig({
      preferences: {
        refreshCycle: 1,
        reconnectRetries: 3,
        connectTimeoutSeconds: 5,
        dataPoints: 30,
        recordDirPath: '',
        logDirPath: ''
      },
      systems: [
        {
          name: 'Database',
          hostName: 'db.example.com',
          port: '22',
          userName: 'oracle',
          passWord: 'secret',
          sshKey: ''
        }
      ]
    });

    const activated = activateSystemState(system, {
      os: 'Linux',
      hostName: 'db.example.com',
      cpuType: 'Unknown',
      cpus: 0,
      memoryKB: 0,
      kernelVersion: 'unknown',
      architecture: 'unknown',
      vmStatPattern: 'pending'
    });

    expect(activated.connected).toBe(true);
    expect(activated.osInfo?.os).toBe('Linux');
  });


  it('adds or replaces a system by name in config persistence', () => {
    const config: SysMonitorConfig = {
      preferences: {
        refreshCycle: 1,
        reconnectRetries: 3,
        connectTimeoutSeconds: 5,
        dataPoints: 30,
        recordDirPath: '',
        logDirPath: ''
      },
      systems: [
        {
          name: 'Database',
          hostName: 'old.example.com',
          port: '22',
          userName: 'oracle',
          passWord: '',
          sshKey: ''
        }
      ]
    };

    const updated = addSystemToConfig(config, {
      name: 'Database',
      hostName: 'db.example.com',
      port: '2222',
      userName: 'oracle',
      passWord: 'secret',
      sshKey: ''
    });

    expect(updated.systems).toEqual([
      {
        name: 'Database',
        hostName: 'db.example.com',
        port: '2222',
        userName: 'oracle',
        passWord: 'secret',
        sshKey: ''
      }
    ]);
  });

  it('removes a system by name from config persistence', () => {
    const config: SysMonitorConfig = {
      preferences: {
        refreshCycle: 1,
        reconnectRetries: 3,
        connectTimeoutSeconds: 5,
        dataPoints: 30,
        recordDirPath: '',
        logDirPath: ''
      },
      systems: [
        {
          name: 'Database',
          hostName: 'db.example.com',
          port: '22',
          userName: 'oracle',
          passWord: '',
          sshKey: ''
        },
        {
          name: 'App Server',
          hostName: 'app.example.com',
          port: '2222',
          userName: 'deploy',
          passWord: '',
          sshKey: '/home/me/id_rsa'
        }
      ]
    };

    const updated = removeSystemFromConfig(config, 'Database');

    expect(updated.systems).toEqual([
      {
        name: 'App Server',
        hostName: 'app.example.com',
        port: '2222',
        userName: 'deploy',
        passWord: '',
        sshKey: '/home/me/id_rsa'
      }
    ]);
  });

  it('keeps bounded datapoint history and updates lastDataPoint', () => {
    const point = (n: number): SystemDataPoint => ({
      runnableProcesses: n,
      blockedProcesses: n,
      swapMemoryKB: n,
      freeMemoryKB: n,
      bufferMemoryKB: n,
      cacheMemoryKB: n,
      swapFromDiskKB: n,
      swapToDiskKB: n,
      readDiskKB: n,
      writeDiskKB: n,
      interrupts: n,
      contextSwitches: n,
      userCPUPercent: n,
      systemCPUPercent: n,
      idleCPUPercent: n,
      waitCPUPercent: n,
      stealCPUPercent: n,
      dateTime: `2026-03-18T12:00:0${n}Z`
    });

    const state = listSystemsFromConfig({
      preferences: {
        refreshCycle: 1,
        reconnectRetries: 3,
        connectTimeoutSeconds: 5,
        dataPoints: 30,
        recordDirPath: '',
        logDirPath: ''
      },
      systems: [
        {
          name: 'Database',
          hostName: 'db.example.com',
          port: '22',
          userName: 'oracle',
          passWord: 'secret',
          sshKey: ''
        }
      ]
    })[0];

    const withHistory = addDataPointToSystemState(
      addDataPointToSystemState(
        addDataPointToSystemState(state, point(1), 2),
        point(2),
        2
      ),
      point(3),
      2
    );

    expect(withHistory.dataPoints).toHaveLength(2);
    expect(withHistory.dataPoints.map((item) => item.runnableProcesses)).toEqual([2, 3]);
    expect(withHistory.lastDataPoint?.runnableProcesses).toBe(3);
    expect(withHistory.connected).toBe(true);
  });
});
