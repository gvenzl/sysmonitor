import { describe, expect, it } from 'vitest';

import { getLogFilePath, normalizeLogDirectory, renderErrorLogLine, renderLogLine } from '../../../src/core/logging/sysLogger';

describe('sysLogger', () => {
  it('disables logging when no path is configured', () => {
    expect(normalizeLogDirectory('')).toBeNull();
    expect(normalizeLogDirectory(null)).toBeNull();
  });

  it('uses SysMonitor.log inside the configured directory', () => {
    expect(getLogFilePath('/tmp/sysmonitor/logs')).toBe('/tmp/sysmonitor/logs/SysMonitor.log');
  });

  it('formats normal log lines without a prefix', () => {
    expect(renderLogLine('Connection lost, reconnecting...')).toBe('Connection lost, reconnecting...');
  });

  it('formats error log lines with the Java-compatible prefix', () => {
    expect(renderErrorLogLine('Cannot parse string')).toBe('ERROR: Cannot parse string');
  });
});
