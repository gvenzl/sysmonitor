import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { BrowserWindowConstructorOptions } from 'electron';
import { app, BrowserWindow } from 'electron';

import type { AppMetadata } from '../shared/contracts/app';
import { registerConfigIpcHandlers } from './ipc/configIpc';
import { registerSystemsIpcHandlers } from './ipc/systemsIpc';
import { createAppMenu } from './menu/createAppMenu';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rendererDevServerUrl = process.env.ELECTRON_RENDERER_URL;

export function getAppMetadata(): AppMetadata {
    return {
        name: 'SysMonitor',
        version: '2.0.0'
    };
}

export function createMainWindowConfig(): BrowserWindowConstructorOptions {
    const preloadPath = path.join(__dirname, '../preload/preload.js');

    if (!fs.existsSync(preloadPath)) {
        throw new Error(`Electron preload script is missing at ${preloadPath}`);
    }

    return {
        width: 1440,
        height: 960,
        minWidth: 1024,
        minHeight: 720,
        show: false,
        title: getAppMetadata().name,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    };
}

export async function createMainWindow(): Promise<BrowserWindow> {
    const window = new BrowserWindow(createMainWindowConfig());

    if (rendererDevServerUrl !== undefined && rendererDevServerUrl !== '') {
        await window.loadURL(rendererDevServerUrl);
    }
    else {
        await window.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    window.once('ready-to-show', () => {
        window.show();
    });

    return window;
}

export async function bootstrapApplication(): Promise<void> {
    await app.whenReady();

    registerConfigIpcHandlers({ getAppMetadata });
    registerSystemsIpcHandlers();
    createAppMenu();
    await createMainWindow();

    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            await createMainWindow();
        }
    });
}

export function registerApplicationLifecycle(): void {
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
}

if (process.env.VITEST !== 'true') {
    registerApplicationLifecycle();
    void bootstrapApplication();
}
