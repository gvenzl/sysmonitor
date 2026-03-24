import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IPC_CHANNELS } from '../../../src/shared/contracts/ipc';

const electronMocks = vi.hoisted(() => {
  const buildFromTemplate = vi.fn((template) => ({ template }));
  const setApplicationMenu = vi.fn();
  const send = vi.fn();
  const getFocusedWindow = vi.fn(() => ({ webContents: { send } }));

  return {
    buildFromTemplate,
    setApplicationMenu,
    send,
    getFocusedWindow
  };
});

vi.mock('electron', () => ({
  BrowserWindow: {
    getFocusedWindow: electronMocks.getFocusedWindow
  },
  Menu: {
    buildFromTemplate: electronMocks.buildFromTemplate,
    setApplicationMenu: electronMocks.setApplicationMenu
  }
}));

import { createAppMenu } from '../../../src/electron/menu/createAppMenu';

describe('createAppMenu', () => {
  beforeEach(() => {
    electronMocks.buildFromTemplate.mockClear();
    electronMocks.setApplicationMenu.mockClear();
    electronMocks.send.mockClear();
  });

  it('registers system and edit menus with renderer commands and clipboard roles', () => {
    createAppMenu();

    expect(electronMocks.buildFromTemplate).toHaveBeenCalledTimes(1);
    const template = electronMocks.buildFromTemplate.mock.calls[0][0];
    expect(template).toHaveLength(2);
    expect(template[0].label).toBe('System');
    expect(template[1].label).toBe('Edit');
    expect(template[1].submenu.map((item: { role?: string }) => item.role).filter(Boolean)).toEqual([
      'undo',
      'redo',
      'cut',
      'copy',
      'paste',
      'selectAll'
    ]);

    template[0].submenu[1].click();
    expect(electronMocks.send).toHaveBeenCalledWith(IPC_CHANNELS.rendererCommand, 'system:new');

    template[0].submenu[2].click();
    expect(electronMocks.send).toHaveBeenCalledWith(IPC_CHANNELS.rendererCommand, 'system:preferences');

    expect(electronMocks.setApplicationMenu).toHaveBeenCalledTimes(1);
  });
});
