import { describe, expect, it } from 'vitest';

import { IPC_CHANNELS } from '../../../src/shared/contracts/ipc';

describe('IPC contract surface', () => {
  it('defines stable app and config channels', () => {
    expect(IPC_CHANNELS.getAppMetadata).toBe('app:getMetadata');
    expect(IPC_CHANNELS.getConfig).toBe('config:get');
    expect(IPC_CHANNELS.saveConfig).toBe('config:save');
  });

  it('defines stable system channels', () => {
    expect(IPC_CHANNELS.listSystems).toBe('systems:list');
    expect(IPC_CHANNELS.addSystem).toBe('systems:add');
    expect(IPC_CHANNELS.removeSystem).toBe('systems:remove');
    expect(IPC_CHANNELS.openSshKeyFile).toBe('systems:openSshKeyFile');
    expect(IPC_CHANNELS.systemsUpdated).toBe('systems:updated');
  });
});
