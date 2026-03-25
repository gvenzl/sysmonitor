import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildRecordingHeader, buildRecordingPath, validateRecordDirectory } from '../../../src/core/recording/recordingService';

describe('recordingService', () => {
  it('uses the configured record directory when present', () => {
    expect(buildRecordingPath({
      basePath: '/tmp/records',
      prefix: '',
      systemName: 'Database'
    })).toBe(path.join('/tmp/records', 'Database.log'));
  });

  it('falls back to the user home directory when no record path is configured', () => {
    expect(buildRecordingPath({
      basePath: '',
      prefix: '',
      systemName: 'Database'
    })).toBe(path.join(os.homedir(), 'Database.log'));
  });

  it('prepends the prefix when provided', () => {
    expect(buildRecordingPath({
      basePath: '/tmp/records',
      prefix: 'prod-',
      systemName: 'Database'
    })).toBe(path.join('/tmp/records', 'prod-Database.log'));
  });

  it('builds the Java-compatible recording header', () => {
    expect(buildRecordingHeader({
      connectionName: 'Database',
      systemName: 'db01.example.com',
      cpuCount: '8',
      memoryGb: '31',
      osName: 'Linux',
      architecture: 'x86_64',
      osVersion: '6.8.0',
      vmstatHeaders: 'procs -----------memory----------'
    })).toContain('Name: Database    System: db01.example.com    CPUs: 8    Memory(GBs): 31');
  });

  it('rejects an empty record directory input for the explicit dialog flow', async () => {
    await expect(validateRecordDirectory('')).resolves.toEqual({
      valid: false,
      reason: "Directory '' is not a directory."
    });
  });
});
