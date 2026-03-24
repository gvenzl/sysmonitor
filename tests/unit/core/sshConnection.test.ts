import { describe, expect, it } from 'vitest';

import type { SystemConnectionInput } from '../../../src/shared/contracts/system';
import { buildBaseSshArgs } from '../../../src/core/ssh/connection';

function createSystem(overrides: Partial<SystemConnectionInput> = {}): SystemConnectionInput {
  return {
    name: 'db',
    hostName: 'db.example.com',
    port: '22',
    userName: 'oracle',
    passWord: '',
    sshKey: '',
    ...overrides
  };
}

describe('SSH connection arguments', () => {
  it('does not disable host key verification by default', () => {
    const args = buildBaseSshArgs(createSystem());

    expect(args).not.toContain('StrictHostKeyChecking=no');
    expect(args).not.toContain('UserKnownHostsFile=/dev/null');
  });

  it('includes an explicit ssh key path when provided', () => {
    const args = buildBaseSshArgs(createSystem({ sshKey: '/tmp/id_rsa' }));

    expect(args).toContain('-i');
    expect(args).toContain('/tmp/id_rsa');
  });
});
