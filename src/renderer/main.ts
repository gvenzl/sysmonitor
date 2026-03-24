import { createAppViewModel, getEmptySystemInput, type DialogView, renderApp } from './App';
import { type SystemChartScales, type MonitoredSystemState, getSystemChartScales } from './components/monitoring/systemCard';
import { loadBootstrapState, openSshKeyFile, removeSystem, savePreferences, submitSystem, subscribeToRendererCommands, type BootstrapState } from './state/bootstrap';
import './styles/app.css';

function renderRoot(root: HTMLElement, state: BootstrapState, activeDialog: DialogView, pendingRemovalSystemName: string | undefined, chartScales: Record<string, SystemChartScales>): void {
    root.innerHTML = renderApp(createAppViewModel(state, activeDialog, pendingRemovalSystemName, chartScales));
}

function updateChartScales(currentScales: Record<string, SystemChartScales>, systems: MonitoredSystemState[]): Record<string, SystemChartScales> {
    const nextScales: Record<string, SystemChartScales> = {};

    for (const system of systems) {
        nextScales[system.connection.name] = getSystemChartScales(system, currentScales[system.connection.name]);
    }

    return nextScales;
}

function bindDialogCloseButtons(root: HTMLElement, closeDialog: () => void): void {
    const closeButtons = root.querySelectorAll<HTMLElement>('[data-close-dialog="true"]');
    closeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            closeDialog();
        });
    });
}

function bindRemoveSystemButtons(root: HTMLElement, openRemoveDialog: (systemName: string) => void): void {
    const removeButtons = root.querySelectorAll<HTMLButtonElement>('[data-remove-system]');
    removeButtons.forEach((button) => {
        const systemName = button.dataset.removeSystem;
        if (systemName !== undefined && systemName !== '') {
            button.addEventListener('click', () => {
                openRemoveDialog(systemName);
            });
        }
    });
}

function bindConfirmRemoveButton(root: HTMLElement, getPendingRemovalSystemName: () => string | undefined, closeDialog: () => void, rerender: (state: BootstrapState, dialog: DialogView, pendingRemovalSystemName?: string) => void): void {
    const confirmButton = root.querySelector<HTMLButtonElement>('[data-confirm-remove="true"]');
    if (confirmButton === null) {
        return;
    }

    confirmButton.addEventListener('click', async () => {
        const systemName = getPendingRemovalSystemName();
        if (systemName === undefined || systemName === '') {
            return;
        }

        const nextState = await removeSystem({ systemName });
        rerender(nextState, 'closed');
        closeDialog();
    });
}

function bindOpenDialogButtons(root: HTMLElement, openDialog: (dialog: DialogView) => void): void {
    const openButtons = root.querySelectorAll<HTMLElement>('[data-open-dialog]');
    openButtons.forEach((button) => {
        const dialog = button.dataset.openDialog;
        if (dialog === 'add-system' || dialog === 'preferences') {
            button.addEventListener('click', () => {
                openDialog(dialog);
            });
        }
    });
}

function bindThemeToggle(root: HTMLElement, getState: () => BootstrapState, rerender: (state: BootstrapState, dialog: DialogView, pendingRemovalSystemName?: string) => void): void {
    const options = root.querySelectorAll<HTMLButtonElement>('[data-theme-mode-option]');
    if (options.length === 0) {
        return;
    }

    options.forEach((option) => {
        const themeMode = option.dataset.themeModeOption;
        if (themeMode !== 'dark' && themeMode !== 'light') {
            return;
        }

        option.addEventListener('click', async () => {
            const currentState = getState();
            if (currentState.config.preferences.themeMode === themeMode) {
                return;
            }

            const nextConfig = {
                ...currentState.config,
                preferences: {
                    ...currentState.config.preferences,
                    themeMode
                }
            };
            const nextState = await savePreferences({ config: nextConfig });
            rerender(nextState, 'closed');
        });
    });
}

function bindAddSystemForm(root: HTMLElement, getState: () => BootstrapState, closeDialog: () => void, rerender: (state: BootstrapState, dialog: DialogView, pendingRemovalSystemName?: string) => void): void {
    const form = root.querySelector<HTMLFormElement>('#add-system-form');
    if (form === null) {
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const system = getEmptySystemInput();
        system.name = String(formData.get('name') ?? '').trim();
        system.hostName = String(formData.get('hostName') ?? '').trim();
        system.port = String(formData.get('port') ?? '22').trim() || '22';
        system.userName = String(formData.get('userName') ?? '').trim();
        system.passWord = String(formData.get('passWord') ?? '');
        system.sshKey = String(formData.get('sshKey') ?? '').trim();

        const nextState = await submitSystem({ system });
        rerender(nextState, 'closed');
        closeDialog();
    });
}

function bindSshKeyBrowseButton(root: HTMLElement): void {
    const button = root.querySelector<HTMLButtonElement>('[data-browse-ssh-key="true"]');
    const input = root.querySelector<HTMLInputElement>('input[name="sshKey"]');
    if (button === null || input === null) {
        return;
    }

    button.addEventListener('click', async () => {
        const selectedPath = await openSshKeyFile();
        if (selectedPath !== null) {
            input.value = selectedPath;
        }
    });
}

function shouldRerenderForSystemsUpdate(activeDialog: DialogView): boolean {
    return activeDialog === 'closed';
}

function focusDialogTarget(root: HTMLElement, dialog: DialogView): void {
    if (dialog === 'closed') {
        return;
    }

    const selector = dialog === 'confirm-remove'
        ? '[data-dialog="confirm-remove"] [data-confirm-remove="true"]'
        : `[data-dialog="${dialog}"] input`;
    const activeDialogTarget = root.querySelector<HTMLElement>(selector);
    activeDialogTarget?.focus();
}

function bindPreferencesForm(root: HTMLElement, getState: () => BootstrapState, closeDialog: () => void, rerender: (state: BootstrapState, dialog: DialogView, pendingRemovalSystemName?: string) => void): void {
    const form = root.querySelector<HTMLFormElement>('#preferences-form');
    if (form === null) {
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const currentState = getState();
        const nextConfig = {
            ...currentState.config,
            preferences: {
                ...currentState.config.preferences,
                refreshCycle: Number(formData.get('refreshCycle') ?? currentState.config.preferences.refreshCycle),
                reconnectRetries: Number(formData.get('reconnectRetries') ?? currentState.config.preferences.reconnectRetries),
                connectTimeoutSeconds: Number(formData.get('connectTimeoutSeconds') ?? currentState.config.preferences.connectTimeoutSeconds),
                dataPoints: Number(formData.get('dataPoints') ?? currentState.config.preferences.dataPoints),
                recordDirPath: String(formData.get('recordDirPath') ?? currentState.config.preferences.recordDirPath).trim(),
                logDirPath: String(formData.get('logDirPath') ?? currentState.config.preferences.logDirPath).trim()
            }
        };

        const nextState = await savePreferences({ config: nextConfig });
        rerender(nextState, 'closed');
        closeDialog();
    });
}

function bindRenderer(root: HTMLElement, getState: () => BootstrapState, getDialog: () => DialogView, setDialog: (dialog: DialogView) => void, getPendingRemovalSystemName: () => string | undefined, setPendingRemovalSystemName: (systemName?: string) => void, rerender: (state: BootstrapState, dialog: DialogView, pendingRemovalSystemName?: string) => void): void {
    const closeDialog = (): void => {
        setPendingRemovalSystemName(undefined);
        setDialog('closed');
        rerender(getState(), 'closed');
    };

    const openDialog = (dialog: DialogView): void => {
        setPendingRemovalSystemName(undefined);
        setDialog(dialog);
        rerender(getState(), dialog);
        focusDialogTarget(root, dialog);
    };

    const openRemoveDialog = (systemName: string): void => {
        setPendingRemovalSystemName(systemName);
        setDialog('confirm-remove');
        rerender(getState(), 'confirm-remove', systemName);
        focusDialogTarget(root, 'confirm-remove');
    };

    bindDialogCloseButtons(root, closeDialog);
    bindOpenDialogButtons(root, openDialog);
    bindRemoveSystemButtons(root, openRemoveDialog);
    bindConfirmRemoveButton(root, getPendingRemovalSystemName, closeDialog, rerender);
    bindThemeToggle(root, getState, rerender);
    bindSshKeyBrowseButton(root);
    bindAddSystemForm(root, getState, closeDialog, rerender);
    bindPreferencesForm(root, getState, closeDialog, rerender);

}

async function bootstrapRenderer(): Promise<void> {
    const root = document.getElementById('app');
    if (root === null) {
        throw new Error('Renderer root element #app is missing.');
    }

    root.innerHTML = '<p class="loading">Loading SysMonitor…</p>';

    try {
        let state = await loadBootstrapState();
        let activeDialog: DialogView = 'closed';
        let pendingRemovalSystemName: string | undefined;
        let chartScales: Record<string, SystemChartScales> = updateChartScales({}, state.systems);

        const rerender = (nextState: BootstrapState, nextDialog: DialogView, nextPendingRemovalSystemName?: string): void => {
            state = nextState;
            activeDialog = nextDialog;
            pendingRemovalSystemName = nextPendingRemovalSystemName;
            chartScales = updateChartScales(chartScales, state.systems);
            document.title = state.metadata.name;
            document.documentElement.dataset.themeMode = state.config.preferences.themeMode;
            renderRoot(root, state, activeDialog, pendingRemovalSystemName, chartScales);
            bindRenderer(root, () => state, () => activeDialog, (dialog) => {
                activeDialog = dialog;
            }, () => pendingRemovalSystemName, (systemName) => {
                pendingRemovalSystemName = systemName;
            }, rerender);
        };

        rerender(state, activeDialog, pendingRemovalSystemName);

        subscribeToRendererCommands((command) => {
            const nextDialog: DialogView = command === 'system:new' ? 'add-system' : 'preferences';
            rerender(state, nextDialog);
        });

        window.sysmonitor.onSystemsUpdated((systems) => {
            state = {
                ...state,
                systems
            };

            if (!shouldRerenderForSystemsUpdate(activeDialog)) {
                return;
            }

            rerender(state, activeDialog, pendingRemovalSystemName);
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown renderer bootstrap error';
        root.innerHTML = `<main class="app-shell"><section class="panel-surface error"><h1>Cannot start SysMonitor</h1><p>${message}</p></section></main>`;
    }
}

void bootstrapRenderer();
