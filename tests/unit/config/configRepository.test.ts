import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { createDefaultConfig, getConfigDirectory, getConfigFilePath, normalizeConfig, readConfigFromDisk, writeConfigToDisk } from '../../../src/core/config/configRepository';

describe('configRepository', () => {
  it('uses config.json in the sysmonitor home directory', () => {
    expect(getConfigDirectory()).toBe(path.join(os.homedir(), '.sysmonitor'));
    expect(getConfigFilePath()).toBe(path.join(os.homedir(), '.sysmonitor', 'config.json'));
  });

  it('creates the default config shape', () => {
    expect(createDefaultConfig()).toEqual({
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
    });
  });

  it('normalizes partial config payloads to the full JSON shape', () => {
    expect(normalizeConfig({
      preferences: {
        themeMode: 'light',
        refreshCycle: 4,
        reconnectRetries: 8,
        connectTimeoutSeconds: 20,
        dataPoints: 60,
        recordDirPath: '/tmp/records',
        logDirPath: '/tmp/logs'
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
    })).toEqual({
      preferences: {
        themeMode: 'light',
        refreshCycle: 4,
        reconnectRetries: 8,
        connectTimeoutSeconds: 20,
        dataPoints: 60,
        recordDirPath: '/tmp/records',
        logDirPath: '/tmp/logs'
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
  });

  it('reads a missing JSON config as defaults', async () => {
    const filePath = path.join(process.cwd(), 'tmp', `missing-${Date.now()}.json`);

    await expect(readConfigFromDisk(filePath)).resolves.toEqual(createDefaultConfig());
  });

  it('writes and reads JSON config data', async () => {
    const filePath = path.join(process.cwd(), 'tmp', `config-${Date.now()}.json`);
    const config = {
      preferences: {
        themeMode: 'light',
        refreshCycle: 2,
        reconnectRetries: 4,
        connectTimeoutSeconds: 7,
        dataPoints: 45,
        recordDirPath: '/tmp/records',
        logDirPath: '/tmp/logs'
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

    await writeConfigToDisk(config, filePath);

    await expect(readConfigFromDisk(filePath)).resolves.toEqual(config);
  });
});
