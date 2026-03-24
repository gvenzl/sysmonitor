import { describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  default: {
    existsSync: () => true
  },
  existsSync: () => true
}));

import { createMainWindowConfig, getAppMetadata } from '../../../src/electron/main';

describe('Electron shell bootstrap', () => {
  it('uses a preload script for the main window', () => {
    const config = createMainWindowConfig();

    expect(config.webPreferences?.preload).toBeTruthy();
  });

  it('disables renderer node integration', () => {
    const config = createMainWindowConfig();

    expect(config.webPreferences?.nodeIntegration).toBe(false);
  });

  it('enables context isolation', () => {
    const config = createMainWindowConfig();

    expect(config.webPreferences?.contextIsolation).toBe(true);
  });

  it('enables renderer sandboxing', () => {
    const config = createMainWindowConfig();

    expect(config.webPreferences?.sandbox).toBe(true);
  });

  it('exposes product metadata', () => {
    expect(getAppMetadata()).toEqual({
      name: 'SysMonitor',
      version: '2.0.0'
    });
  });
});
