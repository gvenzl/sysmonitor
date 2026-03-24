import type { ConfigPreferences } from '../core/config/configSchema';
import type { SystemConnectionInput } from '../shared/contracts/system';
import type { BootstrapState } from './state/bootstrap';
import { renderSystemCard, type SystemChartScales } from './components/monitoring/systemCard';

export type DialogView = 'closed' | 'add-system' | 'preferences' | 'confirm-remove';

export interface AppViewModel {
    bootstrap: BootstrapState;
    activeDialog: DialogView;
    pendingRemovalSystemName?: string;
    chartScales?: Record<string, SystemChartScales>;
}

function renderSystemsSummary(systemCount: number): string {
    if (systemCount === 0) {
        return 'No systems configured yet. Add a system to begin monitoring.';
    }

    if (systemCount === 1) {
        return '1 configured system is ready for monitoring.';
    }

    return `${systemCount} configured systems are ready for monitoring.`;
}

function renderSystemItems(state: BootstrapState, chartScales: Record<string, SystemChartScales> | undefined): string {
    if (state.systems.length === 0) {
        return '<li class="system-empty">No monitored systems loaded yet.</li>';
    }

    return state.systems
        .map((system) => `
            <li class="system-item">
                ${renderSystemCard(system, chartScales?.[system.connection.name])}
            </li>
        `)
        .join('');
}

function renderStatTile(label: string, value: string, toneClass: string): string {
    return `
        <article class="hero-stat ${toneClass}">
            <span>${label}</span>
            <strong>${value}</strong>
        </article>
    `;
}

function renderPreferencesSummary(preferences: ConfigPreferences): string {
    return `
        <ul class="dashboard-meta-list dashboard-meta-list--compact">
            <li><span>Theme</span><strong>${preferences.themeMode}</strong></li>
            <li><span>Refresh</span><strong>${preferences.refreshCycle}s</strong></li>
            <li><span>Retries</span><strong>${preferences.reconnectRetries}</strong></li>
            <li><span>Timeout</span><strong>${preferences.connectTimeoutSeconds}s</strong></li>
            <li><span>Points</span><strong>${preferences.dataPoints}</strong></li>
        </ul>
    `;
}

function renderDashboardEmptyState(): string {
    return `
        <article class="dashboard-empty panel-surface">
            <h3>Graph-first monitoring is ready</h3>
            <p>No systems are connected yet, so the dashboard is standing by. Open from the System menu to add your first monitored host.</p>
        </article>
    `;
}

function renderThemeToggle(themeMode: ConfigPreferences['themeMode']): string {
    return `
        <div class="theme-toggle" aria-label="Theme mode">
            <div class="theme-switch" data-theme-toggle="true" role="tablist" aria-label="Theme mode">
                <button type="button" class="theme-switch__option${themeMode === 'dark' ? ' is-active' : ''}" data-theme-mode-option="dark" aria-pressed="${String(themeMode === 'dark')}">Dark</button>
                <button type="button" class="theme-switch__option${themeMode === 'light' ? ' is-active' : ''}" data-theme-mode-option="light" aria-pressed="${String(themeMode === 'light')}">Light</button>
            </div>
        </div>
    `;
}

function renderInWindowMenuBar(themeMode: ConfigPreferences['themeMode']): string {
    return `
        <nav class="window-menu-bar panel-surface" aria-label="Application menu">
            <div class="window-menu-bar__brand">
                <span class="eyebrow">System</span>
                <strong>Controls</strong>
            </div>
            <div class="window-menu-bar__actions">
                <button type="button" class="button button--ghost window-menu-bar__button" data-open-dialog="add-system">New System</button>
                <button type="button" class="button button--ghost window-menu-bar__button" data-open-dialog="preferences">Preferences</button>
                ${renderThemeToggle(themeMode)}
            </div>
        </nav>
    `;
}

function renderDashboardHero(state: BootstrapState): string {
    const connectedSystems = state.systems.filter((system) => system.connected).length;

    return `
        <section class="dashboard-hero panel-surface">
            <div class="dashboard-hero__copy">
                <p class="eyebrow">Monitoring dashboard</p>
                <p class="dashboard-hero__lede">${renderSystemsSummary(state.systems.length)} Open from the System menu to add systems or adjust preferences without giving up dashboard space.</p>
                <p class="subtle">Version ${state.metadata.version}</p>
            </div>
            <div class="dashboard-hero__side">
                <div class="dashboard-hero__stats">
                    ${renderStatTile('Connected systems', String(connectedSystems), 'tone-green')}
                </div>
            </div>
        </section>
    `;
}

function renderAddSystemDialog(defaults: SystemConnectionInput, isOpen: boolean): string {
    return `
        <section class="dialog-backdrop${isOpen ? '' : ' hidden'}" data-dialog="add-system" aria-hidden="${String(!isOpen)}">
            <div class="dialog-shell panel-surface" role="dialog" aria-modal="true" aria-labelledby="dialog-title-add-system">
                <header class="dialog-header">
                    <div>
                        <p class="eyebrow">System menu</p>
                        <h2 id="dialog-title-add-system">Add system</h2>
                    </div>
                    <button type="button" class="dialog-close" data-close-dialog="true" aria-label="Close add system dialog">×</button>
                </header>
                <form id="add-system-form" class="system-form dialog-form">
                    <label>Name<input name="name" value="${defaults.name}" /></label>
                    <label>Host<input name="hostName" value="${defaults.hostName}" /></label>
                    <label>Port<input name="port" value="${defaults.port}" /></label>
                    <label>User<input name="userName" value="${defaults.userName}" /></label>
                    <label>Password<input type="password" name="passWord" value="${defaults.passWord}" /></label>
                    <label>SSH key</label>
                    <div class="ssh-key-field">
                        <input name="sshKey" value="${defaults.sshKey}" />
                        <button type="button" class="button button--ghost ssh-key-field__button" data-browse-ssh-key="true">Browse…</button>
                    </div>
                    <div class="dialog-actions">
                        <button type="button" class="button button--ghost" data-close-dialog="true">Cancel</button>
                        <button type="submit" class="button">Add system</button>
                    </div>
                </form>
            </div>
        </section>
    `;
}

function renderPreferencesDialog(preferences: ConfigPreferences, isOpen: boolean): string {
    return `
        <section class="dialog-backdrop${isOpen ? '' : ' hidden'}" data-dialog="preferences" aria-hidden="${String(!isOpen)}">
            <div class="dialog-shell panel-surface" role="dialog" aria-modal="true" aria-labelledby="dialog-title-preferences">
                <header class="dialog-header">
                    <div>
                        <p class="eyebrow">System menu</p>
                        <h2 id="dialog-title-preferences">Preferences</h2>
                    </div>
                    <button type="button" class="dialog-close" data-close-dialog="true" aria-label="Close preferences dialog">×</button>
                </header>
                <form id="preferences-form" class="system-form dialog-form">
                    <label>Refresh cycle<input name="refreshCycle" type="number" min="1" max="86400" value="${preferences.refreshCycle}" /></label>
                    <label>Reconnect retries<input name="reconnectRetries" type="number" min="1" max="10" value="${preferences.reconnectRetries}" /></label>
                    <label>Connect timeout<input name="connectTimeoutSeconds" type="number" min="1" max="300" value="${preferences.connectTimeoutSeconds}" /></label>
                    <label>Data points<input name="dataPoints" type="number" min="5" max="1000" value="${preferences.dataPoints}" /></label>
                    <label>Record directory<input name="recordDirPath" value="${preferences.recordDirPath}" /></label>
                    <label>Log directory<input name="logDirPath" value="${preferences.logDirPath}" /></label>
                    <div class="dialog-actions">
                        <button type="button" class="button button--ghost" data-close-dialog="true">Cancel</button>
                        <button type="submit" class="button">Save preferences</button>
                    </div>
                </form>
            </div>
        </section>
    `;
}

function renderRemoveSystemDialog(systemName: string | undefined, isOpen: boolean): string {
    const title = systemName ?? 'this system';

    return `
        <section class="dialog-backdrop${isOpen ? '' : ' hidden'}" data-dialog="confirm-remove" aria-hidden="${String(!isOpen)}">
            <div class="dialog-shell panel-surface dialog-shell--compact" role="dialog" aria-modal="true" aria-labelledby="dialog-title-remove-system">
                <header class="dialog-header">
                    <div>
                        <p class="eyebrow">System removal</p>
                        <h2 id="dialog-title-remove-system">Remove ${title}?</h2>
                    </div>
                    <button type="button" class="dialog-close" data-close-dialog="true" aria-label="Close remove system confirmation">×</button>
                </header>
                <p class="subtle">This removes the system from the monitoring dashboard and from the configuration data.</p>
                <div class="dialog-actions">
                    <button type="button" class="button button--ghost" data-close-dialog="true">Cancel</button>
                    <button type="button" class="button button--danger" data-confirm-remove="true">Remove system</button>
                </div>
            </div>
        </section>
    `;
}

export function getEmptySystemInput(): SystemConnectionInput {
    return {
        name: '',
        hostName: '',
        port: '22',
        userName: '',
        passWord: '',
        sshKey: ''
    };
}

export function createAppViewModel(bootstrap: BootstrapState, activeDialog: DialogView = 'closed', pendingRemovalSystemName?: string, chartScales?: Record<string, SystemChartScales>): AppViewModel {
    return {
        bootstrap,
        activeDialog,
        pendingRemovalSystemName,
        chartScales
    };
}

export function renderApp(viewModel: BootstrapState | AppViewModel): string {
    const appViewModel = 'bootstrap' in viewModel ? viewModel : createAppViewModel(viewModel);
    const state = appViewModel.bootstrap;
    const defaults = getEmptySystemInput();

    return `
        <main class="app-shell">
            ${renderInWindowMenuBar(state.config.preferences.themeMode)}
            ${renderDashboardHero(state)}
            <section class="dashboard-layout">
                <article class="dashboard-stage panel-surface">
                    <div class="dashboard-stage__header">
                        <div>
                            <h2>Live system visuals</h2>
                        </div>
                        <div class="dashboard-stage__summary">
                            ${renderPreferencesSummary(state.config.preferences)}
                        </div>
                    </div>
                    <ul class="system-list">${renderSystemItems(state, appViewModel.chartScales)}</ul>
                    ${state.systems.length === 0 ? renderDashboardEmptyState() : ''}
                </article>
            </section>
            ${renderAddSystemDialog(defaults, appViewModel.activeDialog === 'add-system')}
            ${renderPreferencesDialog(state.config.preferences, appViewModel.activeDialog === 'preferences')}
            ${renderRemoveSystemDialog(appViewModel.pendingRemovalSystemName, appViewModel.activeDialog === 'confirm-remove')}
        </main>
    `;
}
