import { createAppViewModel, getEmptySystemInput, renderApp } from '../../../src/renderer/App';
import { getSystemChartScales } from '../../../src/renderer/components/monitoring/systemCard';
import type { MonitoredSystemState, SystemDataPoint } from '../../../src/shared/contracts/system';
import { describe, expect, it, vi } from 'vitest';



import type { BootstrapState } from '../../../src/renderer/state/bootstrap';

function focusDialogTargetTestHarness(root: HTMLElement, dialog: 'closed' | 'add-system' | 'preferences' | 'confirm-remove'): void {
  if (dialog === 'closed') {
    return;
  }

  const selector = dialog === 'confirm-remove'
    ? '[data-dialog=\"confirm-remove\"] [data-confirm-remove=\"true\"]'
    : `[data-dialog=\"${dialog}\"] input`;
  const activeDialogTarget = root.querySelector<{ focus: () => void }>(selector);
  activeDialogTarget?.focus();
}


function shouldRerenderForSystemsUpdateTestHarness(activeDialog: 'closed' | 'add-system' | 'preferences' | 'confirm-remove'): boolean {
  return activeDialog === 'closed';
}

function createBootstrapState(): BootstrapState {
  return {
    metadata: {
      name: 'SysMonitor',
      version: '2.0.0'
    },
    config: {
      preferences: {
        themeMode: 'dark',
        refreshCycle: 1,
        reconnectRetries: 3,
        connectTimeoutSeconds: 5,
        dataPoints: 30,
        recordDirPath: '',
        logDirPath: ''
      },
      systems: []
    },
    systems: []
  };
}

function createDataPoint(overrides: Partial<SystemDataPoint>): SystemDataPoint {
  return {
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
    dateTime: '2026-03-18T12:00:00Z',
    ...overrides
  };
}

function createMonitoredSystemState(dataPoints: SystemDataPoint[]): MonitoredSystemState {
  const lastDataPoint = dataPoints[dataPoints.length - 1];

  return {
    connection: {
      name: 'Database',
      hostName: 'db.example.com',
      port: '22',
      userName: 'oracle',
      passWord: '',
      sshKey: ''
    },
    osInfo: {
      os: 'Linux',
      hostName: 'db01.example.com',
      cpuType: 'AMD EPYC',
      cpus: 8,
      memoryKB: 33554432,
      kernelVersion: '6.8.0',
      architecture: 'x86_64',
      vmStatPattern: 'pattern'
    },
    dataPoints,
    lastDataPoint,
    recording: false,
    connected: true
  };
}

describe('renderer App shell', () => {
  it('renders an empty-state message when no systems are configured', () => {
    const html = renderApp({
      metadata: {
        name: 'SysMonitor',
        version: '2.0.0'
      },
      config: {
        preferences: {
          themeMode: 'dark',
          refreshCycle: 1,
          reconnectRetries: 3,
          connectTimeoutSeconds: 5,
          dataPoints: 30,
          recordDirPath: '',
          logDirPath: ''
        },
        systems: []
      },
      systems: []
    });

    expect(html).toContain('No systems configured yet. Add a system to begin monitoring.');
    expect(html).toContain('Version 2.0.0');
    expect(html).not.toContain('>SysMonitor<');
    expect(html).not.toContain('data-theme-mode="dark"');
    expect(html).toContain('Monitoring dashboard');
    expect(html).toContain('window-menu-bar');
    expect(html).toContain('window-menu-bar__actions');
    expect(html).toContain('data-theme-toggle="true"');
    expect(html).toContain('dashboard-meta-list--compact');
    expect(html).toContain('data-theme-mode-option="dark"');
    expect(html).toContain('data-theme-mode-option="light"');
    expect(html).not.toContain('Swap write');
    expect(html).not.toContain('Run queue</span>');
    expect(html).not.toContain('Blocked queue');
    expect(html).toContain('New System');
    expect(html).toContain('Preferences');
    expect(html).toContain('dashboard-meta-list--compact');
    expect(html).toContain('Refresh');
    expect(html).toContain('Points');
    expect(html).toContain('Open from the System menu');
    expect(html).not.toContain('Run queue and swap stay pinned above the chart regions');
    expect(html).toContain('dialog-backdrop hidden');
    expect(html).not.toContain('<h2>Preferences</h2>');
    expect(html).not.toContain('<h2>Add system</h2>');
  });

  it('renders monitored system cards with a fourth network chart panel', () => {
    const html = renderApp({
      metadata: {
        name: 'SysMonitor',
        version: '2.0.0'
      },
      config: {
        preferences: {
          themeMode: 'light',
          refreshCycle: 2,
          reconnectRetries: 4,
          connectTimeoutSeconds: 7,
          dataPoints: 45,
          recordDirPath: '/tmp/records',
          logDirPath: '/tmp/logs'
        },
        systems: []
      },
      systems: [
        {
          connection: {
            name: 'Database',
            hostName: 'db.example.com',
            port: '22',
            userName: 'oracle',
            passWord: '',
            sshKey: ''
          },
          osInfo: {
            os: 'Linux',
            hostName: 'db01.example.com',
            cpuType: 'AMD EPYC',
            cpus: 8,
            memoryKB: 33554432,
            kernelVersion: '6.8.0',
            architecture: 'x86_64',
            vmStatPattern: 'pattern'
          },
          dataPoints: [
            {
              runnableProcesses: 1,
              blockedProcesses: 0,
              swapMemoryKB: 0,
              freeMemoryKB: 800,
              bufferMemoryKB: 1200,
              cacheMemoryKB: 1400,
              swapFromDiskKB: 2,
              swapToDiskKB: 1,
              readDiskKB: 6,
              writeDiskKB: 7,
              receivedNetworkKB: 64,
              transmittedNetworkKB: 32,
              interrupts: 10,
              contextSwitches: 20,
              userCPUPercent: 30,
              systemCPUPercent: 10,
              idleCPUPercent: 60,
              waitCPUPercent: 2,
              stealCPUPercent: 1,
              dateTime: '2026-03-18T12:00:00Z'
            },
            {
              runnableProcesses: 2,
              blockedProcesses: 1,
              swapMemoryKB: 0,
              freeMemoryKB: 1024,
              bufferMemoryKB: 2048,
              cacheMemoryKB: 4096,
              swapFromDiskKB: 5,
              swapToDiskKB: 3,
              readDiskKB: 11,
              writeDiskKB: 12,
              receivedNetworkKB: 128,
              transmittedNetworkKB: 64,
              interrupts: 100,
              contextSwitches: 200,
              userCPUPercent: 40,
              systemCPUPercent: 20,
              idleCPUPercent: 35,
              waitCPUPercent: 5,
              stealCPUPercent: 2,
              dateTime: '2026-03-18T12:00:45Z'
            }
          ],
          lastDataPoint: {
            runnableProcesses: 2,
            blockedProcesses: 1,
            swapMemoryKB: 0,
            freeMemoryKB: 1024,
            bufferMemoryKB: 2048,
            cacheMemoryKB: 4096,
            swapFromDiskKB: 5,
            swapToDiskKB: 3,
            readDiskKB: 11,
            writeDiskKB: 12,
            receivedNetworkKB: 128,
            transmittedNetworkKB: 64,
            interrupts: 100,
            contextSwitches: 200,
            userCPUPercent: 40,
            systemCPUPercent: 20,
            idleCPUPercent: 35,
            waitCPUPercent: 5,
            stealCPUPercent: 2,
            dateTime: '2026-03-18T12:00:45Z'
          },
          recording: false,
          connected: true
        }
      ]
    });

    expect(html).toContain('chart-panel chart-panel--network');
    expect(html).toContain('chart-y-axis');
    expect(html).toContain('aria-label="Network stacked timeline over the last 60 seconds"');
    expect(html).toContain('stacked-timeline-chart__series stacked-timeline-chart__series--rx');
    expect(html).toContain('stacked-timeline-chart__series stacked-timeline-chart__series--tx');
    expect(html).toContain('Network');
    expect(html).not.toContain('data-theme-mode="light"');
    expect(html).toContain('192 KB/s');
    expect(html).toContain('data-remove-system="Database"');
    expect(html).toContain('aria-label="Remove Database"');
  });


  it('expands and shrinks chart scales based on the current visible cpu and network peaks', () => {
    const highPeakState = createMonitoredSystemState([
      createDataPoint({ userCPUPercent: 70, systemCPUPercent: 20, waitCPUPercent: 5, stealCPUPercent: 5, receivedNetworkKB: 70, transmittedNetworkKB: 50 }),
      createDataPoint({ dateTime: '2026-03-18T12:00:01Z', userCPUPercent: 10, systemCPUPercent: 5, waitCPUPercent: 0, stealCPUPercent: 0, receivedNetworkKB: 10, transmittedNetworkKB: 8 })
    ]);

    const expandedScales = getSystemChartScales(highPeakState);
    expect(expandedScales.cpu).toBe(100);
    expect(expandedScales.network).toBe(120);

    const agedOutPeakState = createMonitoredSystemState([
      createDataPoint({ dateTime: '2026-03-18T12:00:01Z', userCPUPercent: 10, systemCPUPercent: 5, waitCPUPercent: 0, stealCPUPercent: 0, receivedNetworkKB: 10, transmittedNetworkKB: 8 }),
      createDataPoint({ dateTime: '2026-03-18T12:00:02Z', userCPUPercent: 12, systemCPUPercent: 6, waitCPUPercent: 0, stealCPUPercent: 0, receivedNetworkKB: 12, transmittedNetworkKB: 9 })
    ]);

    const recomputedScales = getSystemChartScales(agedOutPeakState, expandedScales);
    expect(recomputedScales.cpu).toBe(18);
    expect(recomputedScales.network).toBe(21);
  });

  it('keeps the scale while an identical peak is still visible in the window', () => {
    const stateWithDuplicatePeaks = createMonitoredSystemState([
      createDataPoint({ userCPUPercent: 60, systemCPUPercent: 25, waitCPUPercent: 10, stealCPUPercent: 5, receivedNetworkKB: 90, transmittedNetworkKB: 30 }),
      createDataPoint({ dateTime: '2026-03-18T12:00:01Z', userCPUPercent: 60, systemCPUPercent: 25, waitCPUPercent: 10, stealCPUPercent: 5, receivedNetworkKB: 90, transmittedNetworkKB: 30 })
    ]);

    const previousScales = getSystemChartScales(stateWithDuplicatePeaks);

    const onePeakDroppedState = createMonitoredSystemState([
      createDataPoint({ dateTime: '2026-03-18T12:00:01Z', userCPUPercent: 60, systemCPUPercent: 25, waitCPUPercent: 10, stealCPUPercent: 5, receivedNetworkKB: 90, transmittedNetworkKB: 30 }),
      createDataPoint({ dateTime: '2026-03-18T12:00:02Z', userCPUPercent: 15, systemCPUPercent: 5, waitCPUPercent: 0, stealCPUPercent: 0, receivedNetworkKB: 10, transmittedNetworkKB: 5 })
    ]);

    const recomputedScales = getSystemChartScales(onePeakDroppedState, previousScales);
    expect(recomputedScales.cpu).toBe(100);
    expect(recomputedScales.network).toBe(120);
  });

  it('renders a shrunken y-axis after old high peaks leave the visible window', () => {
    const system = createMonitoredSystemState([
      createDataPoint({ userCPUPercent: 10, systemCPUPercent: 5, waitCPUPercent: 0, stealCPUPercent: 0, receivedNetworkKB: 10, transmittedNetworkKB: 8 }),
      createDataPoint({ dateTime: '2026-03-18T12:00:02Z', userCPUPercent: 12, systemCPUPercent: 6, waitCPUPercent: 0, stealCPUPercent: 0, receivedNetworkKB: 12, transmittedNetworkKB: 9 })
    ]);

    const html = renderApp({
      metadata: {
        name: 'SysMonitor',
        version: '2.0.0'
      },
      config: {
        preferences: {
          themeMode: 'dark',
          refreshCycle: 1,
          reconnectRetries: 3,
          connectTimeoutSeconds: 5,
          dataPoints: 30,
          recordDirPath: '',
          logDirPath: ''
        },
        systems: []
      },
      systems: [system]
    });

    expect(html).toContain('<span>18%</span>');
    expect(html).toContain('<span>14%</span>');
    expect(html).toContain('<span>21 KB/s</span>');
    expect(html).not.toContain('<span>100%</span>');
    expect(html).not.toContain('<span>120 KB/s</span>');
  });



  it('skips live systems rerenders while the preferences dialog is open', () => {
    expect(shouldRerenderForSystemsUpdateTestHarness('closed')).toBe(true);
    expect(shouldRerenderForSystemsUpdateTestHarness('preferences')).toBe(false);
    expect(shouldRerenderForSystemsUpdateTestHarness('add-system')).toBe(false);
    expect(shouldRerenderForSystemsUpdateTestHarness('confirm-remove')).toBe(false);
  });

  it('focuses dialog controls only when explicitly asked for an opened dialog', () => {
    const refreshCycleInput = { focus: vi.fn() };
    const fakeRoot = {
      querySelector: vi.fn().mockReturnValue(refreshCycleInput)
    } as unknown as HTMLElement;

    focusDialogTargetTestHarness(fakeRoot, 'preferences');
    expect(fakeRoot.querySelector).toHaveBeenCalledWith('[data-dialog="preferences"] input');
    expect(refreshCycleInput.focus).toHaveBeenCalledTimes(1);

    focusDialogTargetTestHarness(fakeRoot, 'closed');
    expect(refreshCycleInput.focus).toHaveBeenCalledTimes(1);
  });

  it('renders the SSH key browse control and theme selector in the add/preferences dialogs', () => {
    const html = renderApp(createAppViewModel({
      metadata: {
        name: 'SysMonitor',
        version: '2.0.0'
      },
      config: {
        preferences: {
          themeMode: 'dark',
          refreshCycle: 2,
          reconnectRetries: 4,
          connectTimeoutSeconds: 7,
          dataPoints: 45,
          recordDirPath: '/tmp/records',
          logDirPath: '/tmp/logs'
        },
        systems: []
      },
      systems: []
    }, 'add-system'));

    expect(html).toContain('name="sshKey"');
    expect(html).toContain('data-browse-ssh-key="true"');
    expect(html).toContain('Browse…');

    const preferencesHtml = renderApp(createAppViewModel({
      metadata: {
        name: 'SysMonitor',
        version: '2.0.0'
      },
      config: {
        preferences: {
          themeMode: 'light',
          refreshCycle: 2,
          reconnectRetries: 4,
          connectTimeoutSeconds: 7,
          dataPoints: 45,
          recordDirPath: '/tmp/records',
          logDirPath: '/tmp/logs'
        },
        systems: []
      },
      systems: []
    }, 'preferences'));

    expect(preferencesHtml).not.toContain('<select name="themeMode">');
  });

  it('renders a confirmation dialog before removing a system', () => {
    const html = renderApp(createAppViewModel({
      metadata: {
        name: 'SysMonitor',
        version: '2.0.0'
      },
      config: {
        preferences: {
          themeMode: 'dark',
          refreshCycle: 2,
          reconnectRetries: 4,
          connectTimeoutSeconds: 7,
          dataPoints: 45,
          recordDirPath: '/tmp/records',
          logDirPath: '/tmp/logs'
        },
        systems: []
      },
      systems: []
    }, 'confirm-remove', 'Database'));

    expect(html).toContain('Remove Database?');
    expect(html).toContain('This removes the system from the monitoring dashboard and from the configuration data.');
    expect(html).toContain('data-confirm-remove="true"');
    expect(html).toContain('Remove system');
  });

  it('provides the default add-system form values', () => {
    expect(getEmptySystemInput()).toEqual({
      name: '',
      hostName: '',
      port: '22',
      userName: '',
      passWord: '',
      sshKey: ''
    });
  });
});
