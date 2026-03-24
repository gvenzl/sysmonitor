import { BrowserWindow, Menu } from 'electron';

import { IPC_CHANNELS, type RendererCommand } from '../../shared/contracts/ipc';

function sendRendererCommand(command: RendererCommand): void {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    focusedWindow?.webContents.send(IPC_CHANNELS.rendererCommand, command);
}

export function createAppMenu(): void {
    const template = [
        {
            label: 'System',
            submenu: [
                { role: 'about' as const },
                {
                    label: 'New',
                    click: () => sendRendererCommand('system:new')
                },
                {
                    label: 'Preferences...',
                    click: () => sendRendererCommand('system:preferences')
                },
                { type: 'separator' as const },
                { role: 'quit' as const }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' as const },
                { role: 'redo' as const },
                { type: 'separator' as const },
                { role: 'cut' as const },
                { role: 'copy' as const },
                { role: 'paste' as const },
                { role: 'selectAll' as const }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
