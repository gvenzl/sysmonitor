import { describe, expect, it } from 'vitest';

import { calculateNetworkRates, parseNetworkCounters, parseVmstatHeaderPattern, parseVmstatLine } from '../../../src/core/vmstat/vmstatParser';

describe('vmstatParser', () => {
  it('builds the expected Linux vmstat regex without guest column', () => {
    const pattern = parseVmstatHeaderPattern(`procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu----- -----timestamp-----\n r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st                 UTC\n 2  0      0 102400  20480  40960    0    0     6    12  100  200 40 20 35  5  0 2026-03-19 12:00:01`);

    expect(pattern).toContain('runQueue');
    expect(pattern).toContain('stealCPU');
  });

  it('parses a vmstat data line into a datapoint', () => {
    const pattern = parseVmstatHeaderPattern(`procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu----- -----timestamp-----\n r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st                 UTC`);
    const point = parseVmstatLine(' 2  1      0 1024  2048  4096    5    3    11    12  100  200 40 20 35  5  2 2026-03-19 12:00:01', pattern);

    expect(point).toEqual({
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
      receivedNetworkKB: 0,
      transmittedNetworkKB: 0,
      interrupts: 100,
      contextSwitches: 200,
      userCPUPercent: 40,
      systemCPUPercent: 20,
      idleCPUPercent: 35,
      waitCPUPercent: 5,
      stealCPUPercent: 2,
      dateTime: '2026-03-19T12:00:01Z'
    });
  });

  it('parses network counters from /proc/net/dev output', () => {
    const counters = parseNetworkCounters(`eth0: 2048 0 0 0 0 0 0 0 1024 0 0 0 0 0 0 0\nens3: 4096 0 0 0 0 0 0 0 2048 0 0 0 0 0 0 0`);

    expect(counters).toEqual({
      receivedBytes: 6144,
      transmittedBytes: 3072
    });
  });

  it('calculates receive/transmit rates in KB per second', () => {
    expect(calculateNetworkRates(
      { receivedBytes: 1024, transmittedBytes: 2048 },
      { receivedBytes: 5120, transmittedBytes: 4096 },
      2
    )).toEqual({
      receivedNetworkKB: 2,
      transmittedNetworkKB: 1
    });
  });

  it('uses precise elapsed time rather than rounding to whole seconds', () => {
    expect(calculateNetworkRates(
      { receivedBytes: 0, transmittedBytes: 0 },
      { receivedBytes: 1536, transmittedBytes: 3072 },
      1.5
    )).toEqual({
      receivedNetworkKB: 1,
      transmittedNetworkKB: 2
    });
  });
});
