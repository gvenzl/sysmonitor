import type { MonitoredSystemState, SystemDataPoint } from '../../../shared/contracts/system';

const TIMELINE_WINDOW_SECONDS = 60;
const CHART_WIDTH = 320;
const CHART_HEIGHT = 96;

type SeriesDefinition = {
    key: string;
    label: string;
    className: string;
    selector: (point: SystemDataPoint) => number;
};

export interface SystemChartScales {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
}

function formatScaledValue(valueKb: number, suffix: string): string {
    if (valueKb >= 1024 * 1024) {
        return `${(valueKb / 1024 / 1024).toFixed(1)} G${suffix}`;
    }

    if (valueKb >= 1024) {
        return `${(valueKb / 1024).toFixed(1)} M${suffix}`;
    }

    return `${valueKb} K${suffix}`;
}

function formatMemory(memoryKb?: number): string {
    if (memoryKb === undefined) {
        return 'Unknown';
    }

    return formatScaledValue(memoryKb, 'B');
}

function formatPercent(value?: number): string {
    return value === undefined ? '0%' : `${value}%`;
}

function formatRate(value?: number): string {
    return value === undefined ? '0 KB/s' : `${formatScaledValue(value, 'B')}/s`;
}

function renderMetricBar(label: string, value: string, toneClass: string): string {
    return `
        <div class="metric-bar ${toneClass}">
            <span>${label}</span>
            <strong>${value}</strong>
        </div>
    `;
}

function parseTimeStamp(point: SystemDataPoint): number {
    const parsed = Date.parse(point.dateTime);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function formatTimelineTime(value: number): string {
    if (value <= 0) {
        return '--:--:--';
    }

    return new Date(value).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatAxisValue(value: number, kind: 'percent' | 'memory' | 'rate'): string {
    if (kind === 'percent') {
        return `${Math.round(value)}%`;
    }

    if (kind === 'memory') {
        return formatScaledValue(Math.round(value), 'B');
    }

    return `${formatScaledValue(Math.round(value), 'B')}/s`;
}

function getTimelineDomain(points: SystemDataPoint[]): { start: number; end: number } {
    if (points.length === 0) {
        return {
            start: 0,
            end: TIMELINE_WINDOW_SECONDS * 1000
        };
    }

    const timestamps = points.map(parseTimeStamp).filter((value) => value > 0);
    if (timestamps.length === 0) {
        return {
            start: 0,
            end: TIMELINE_WINDOW_SECONDS * 1000
        };
    }

    const domainStart = Math.min(...timestamps);
    const domainEnd = Math.max(...timestamps);

    if (domainStart === domainEnd) {
        return {
            start: domainStart,
            end: domainStart + 1000
        };
    }

    return {
        start: domainStart,
        end: domainEnd
    };
}

function buildStackedAreaPath(points: SystemDataPoint[], series: SeriesDefinition[], maxValue: number): string {
    if (points.length === 0) {
        return `M 0 ${CHART_HEIGHT} L ${CHART_WIDTH} ${CHART_HEIGHT} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;
    }

    const domain = getTimelineDomain(points);
    const topBoundary = points.map((point) => {
        const time = parseTimeStamp(point);
        const x = Math.max(0, Math.min(CHART_WIDTH, ((time - domain.start) / Math.max(1, domain.end - domain.start)) * CHART_WIDTH));
        const stackedValue = series.reduce((sum, current) => sum + current.selector(point), 0);
        const normalized = Math.max(0, Math.min(1, stackedValue / Math.max(1, maxValue)));
        const y = CHART_HEIGHT - normalized * CHART_HEIGHT;
        return { x, y };
    });

    const lowerBoundary = points.map((point) => {
        const time = parseTimeStamp(point);
        const x = Math.max(0, Math.min(CHART_WIDTH, ((time - domain.start) / Math.max(1, domain.end - domain.start)) * CHART_WIDTH));
        const stackedValue = series.length === 1 ? 0 : series.slice(0, -1).reduce((sum, current) => sum + current.selector(point), 0);
        const normalized = Math.max(0, Math.min(1, stackedValue / Math.max(1, maxValue)));
        const y = CHART_HEIGHT - normalized * CHART_HEIGHT;
        return { x, y };
    }).reverse();

    const topPath = topBoundary.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
    const lowerPath = lowerBoundary.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');

    return `${topPath} ${lowerPath} Z`;
}

function buildLinePath(points: SystemDataPoint[], selector: (point: SystemDataPoint) => number, maxValue: number): string {
    if (points.length === 0) {
        return `M 0 ${CHART_HEIGHT} L ${CHART_WIDTH} ${CHART_HEIGHT}`;
    }

    const domain = getTimelineDomain(points);

    return points
        .map((point, index) => {
            const time = parseTimeStamp(point);
            const x = Math.max(0, Math.min(CHART_WIDTH, ((time - domain.start) / Math.max(1, domain.end - domain.start)) * CHART_WIDTH));
            const normalized = Math.max(0, Math.min(1, selector(point) / Math.max(1, maxValue)));
            const y = CHART_HEIGHT - normalized * CHART_HEIGHT;
            return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ');
}

function getVisibleMax(points: SystemDataPoint[], seriesDefinitions: SeriesDefinition[]): number {
    return Math.max(
        1,
        ...points.map((point) => seriesDefinitions.reduce((sum, current) => sum + current.selector(point), 0))
    );
}

function keepOrRecomputeScale(visibleMax: number, previousScale: number | undefined): number {
    void previousScale;
    return visibleMax;
}

export function getSystemChartScales(system: MonitoredSystemState, previousScales?: SystemChartScales): SystemChartScales {
    const points = system.dataPoints;

    const cpuSeries: SeriesDefinition[] = [
        { key: 'steal', label: 'Steal', className: 'steal', selector: (point) => point.stealCPUPercent },
        { key: 'wait', label: 'Wait', className: 'wait', selector: (point) => point.waitCPUPercent },
        { key: 'system', label: 'System', className: 'system', selector: (point) => point.systemCPUPercent },
        { key: 'user', label: 'User', className: 'user', selector: (point) => point.userCPUPercent }
    ];

    const memorySeries: SeriesDefinition[] = [
        { key: 'buffers', label: 'Buffers', className: 'buffers', selector: (point) => point.bufferMemoryKB },
        { key: 'cache', label: 'Cache', className: 'cache', selector: (point) => point.cacheMemoryKB },
        { key: 'used', label: 'Used', className: 'used', selector: (point) => Math.max(0, point.bufferMemoryKB + point.cacheMemoryKB + point.freeMemoryKB > 0 ? (point.bufferMemoryKB + point.cacheMemoryKB + point.freeMemoryKB) : point.bufferMemoryKB + point.cacheMemoryKB) }
    ];

    const diskSeries: SeriesDefinition[] = [
        { key: 'read', label: 'Read', className: 'read', selector: (point) => point.readDiskKB },
        { key: 'write', label: 'Write', className: 'write', selector: (point) => point.writeDiskKB }
    ];

    const networkSeries: SeriesDefinition[] = [
        { key: 'rx', label: 'Receive', className: 'rx', selector: (point) => point.receivedNetworkKB },
        { key: 'tx', label: 'Transmit', className: 'tx', selector: (point) => point.transmittedNetworkKB }
    ];

    const visible = {
        cpu: getVisibleMax(points, cpuSeries),
        memory: getVisibleMax(points, memorySeries),
        disk: getVisibleMax(points, diskSeries),
        network: getVisibleMax(points, networkSeries)
    };

    return {
        cpu: keepOrRecomputeScale(visible.cpu, previousScales?.cpu),
        memory: keepOrRecomputeScale(visible.memory, previousScales?.memory),
        disk: keepOrRecomputeScale(visible.disk, previousScales?.disk),
        network: keepOrRecomputeScale(visible.network, previousScales?.network)
    };
}

function renderYAxis(maxValue: number, kind: 'percent' | 'memory' | 'rate'): string {
    const labels = [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0];

    return `
        <div class="chart-y-axis" aria-hidden="true">
            ${labels.map((value) => `<span>${formatAxisValue(value, kind)}</span>`).join('')}
        </div>
    `;
}

function renderStackedTimelineChart(title: string, latestValue: string, points: SystemDataPoint[], seriesDefinitions: SeriesDefinition[], maxValue: number, axisKind: 'percent' | 'memory' | 'rate'): string {
    const domain = getTimelineDomain(points);

    const seriesMarkup = seriesDefinitions
        .map((series, index) => {
            const stackSlice = seriesDefinitions.slice(0, index + 1);
            return `
                <path class="stacked-timeline-chart__series stacked-timeline-chart__series--${series.className}" d="${buildStackedAreaPath(points, stackSlice, maxValue)}"></path>
            `;
        })
        .join('');

    const topLine = buildLinePath(
        points,
        (point) => seriesDefinitions.reduce((sum, current) => sum + current.selector(point), 0),
        maxValue
    );

    return `
        <div class="stacked-timeline-chart">
            <div class="stacked-timeline-chart__label"><span>${title}</span><strong>${latestValue}</strong></div>
            <div class="stacked-timeline-chart__plot">
                ${renderYAxis(maxValue, axisKind)}
                <svg class="stacked-timeline-chart__svg" viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" preserveAspectRatio="none" role="img" aria-label="${title} stacked timeline over the last ${TIMELINE_WINDOW_SECONDS} seconds">
                    <line class="stacked-timeline-chart__grid" x1="0" y1="24" x2="${CHART_WIDTH}" y2="24"></line>
                    <line class="stacked-timeline-chart__grid" x1="0" y1="48" x2="${CHART_WIDTH}" y2="48"></line>
                    <line class="stacked-timeline-chart__grid" x1="0" y1="72" x2="${CHART_WIDTH}" y2="72"></line>
                    ${seriesMarkup}
                    <path class="stacked-timeline-chart__line" d="${topLine}"></path>
                </svg>
            </div>
            <div class="stacked-timeline-chart__legend">
                ${seriesDefinitions.map((series) => `<span class="stacked-timeline-chart__legend-item stacked-timeline-chart__legend-item--${series.className}">${series.label}</span>`).join('')}
            </div>
            <div class="stacked-timeline-chart__footer"><span>${formatTimelineTime(domain.start)}</span><span>${formatTimelineTime(domain.end)}</span></div>
        </div>
    `;
}

function renderCompactDetails(system: MonitoredSystemState): string {
    const osInfo = system.osInfo;

    return `
        <p class="system-card__details system-card__details--compact">
            <span><strong>System</strong> ${osInfo?.hostName ?? system.connection.hostName}</span>
            <span><strong>CPUs</strong> ${osInfo?.cpus ?? '—'}</span>
            <span><strong>Memory</strong> ${formatMemory(osInfo?.memoryKB)}</span>
            <span><strong>OS</strong> ${osInfo?.os ?? 'Unknown'} ${osInfo?.kernelVersion ?? ''}</span>
            <span><strong>Arch</strong> ${osInfo?.architecture ?? 'Unknown'}</span>
        </p>
    `;
}

export function renderSystemCard(system: MonitoredSystemState, chartScales?: SystemChartScales): string {
    const dataPoint = system.lastDataPoint;
    const points = system.dataPoints;

    const cpuSeries: SeriesDefinition[] = [
        { key: 'steal', label: 'Steal', className: 'steal', selector: (point) => point.stealCPUPercent },
        { key: 'wait', label: 'Wait', className: 'wait', selector: (point) => point.waitCPUPercent },
        { key: 'system', label: 'System', className: 'system', selector: (point) => point.systemCPUPercent },
        { key: 'user', label: 'User', className: 'user', selector: (point) => point.userCPUPercent }
    ];

    const memorySeries: SeriesDefinition[] = [
        { key: 'buffers', label: 'Buffers', className: 'buffers', selector: (point) => point.bufferMemoryKB },
        { key: 'cache', label: 'Cache', className: 'cache', selector: (point) => point.cacheMemoryKB },
        { key: 'used', label: 'Used', className: 'used', selector: (point) => Math.max(0, point.bufferMemoryKB + point.cacheMemoryKB + point.freeMemoryKB > 0 ? (point.bufferMemoryKB + point.cacheMemoryKB + point.freeMemoryKB) : point.bufferMemoryKB + point.cacheMemoryKB) }
    ];

    const diskSeries: SeriesDefinition[] = [
        { key: 'read', label: 'Read', className: 'read', selector: (point) => point.readDiskKB },
        { key: 'write', label: 'Write', className: 'write', selector: (point) => point.writeDiskKB }
    ];

    const networkSeries: SeriesDefinition[] = [
        { key: 'rx', label: 'Receive', className: 'rx', selector: (point) => point.receivedNetworkKB },
        { key: 'tx', label: 'Transmit', className: 'tx', selector: (point) => point.transmittedNetworkKB }
    ];

    const latestUsedMemory = dataPoint === undefined ? 0 : Math.max(0, dataPoint.bufferMemoryKB + dataPoint.cacheMemoryKB + dataPoint.freeMemoryKB);
    const scales = chartScales ?? {
        cpu: getVisibleMax(points, cpuSeries),
        memory: getVisibleMax(points, memorySeries),
        disk: getVisibleMax(points, diskSeries),
        network: getVisibleMax(points, networkSeries)
    };

    return `
        <article class="system-card">
            <header class="system-card__header">
                <div class="system-card__headline">
                    <p class="system-card__title">${system.connection.name}</p>
                    <p class="system-card__subtitle">${system.connection.hostName}:${system.connection.port}</p>
                </div>
                <div class="system-card__actions">
                    <span class="system-status ${system.connected ? 'connected' : 'disconnected'}">
                        ${system.connected ? 'Connected' : 'Not connected'}
                    </span>
                    <button type="button" class="system-card__remove" data-remove-system="${system.connection.name}" aria-label="Remove ${system.connection.name}">×</button>
                </div>
            </header>
            ${renderCompactDetails(system)}
            <section class="system-card__visual-stage">
                <section class="system-card__metrics">
                    ${renderMetricBar('Run queue', String(dataPoint?.runnableProcesses ?? 0), 'tone-green')}
                    ${renderMetricBar('Blocked queue', String(dataPoint?.blockedProcesses ?? 0), 'tone-red')}
                    ${renderMetricBar('Swap read', formatRate(dataPoint?.swapFromDiskKB), 'tone-red')}
                    ${renderMetricBar('Swap write', formatRate(dataPoint?.swapToDiskKB), 'tone-blue')}
                </section>
                <section class="system-card__chart-grid">
                    <div class="chart-panel chart-panel--cpu">
                        <h3>CPU</h3>
                        ${renderStackedTimelineChart('CPU', formatPercent((dataPoint?.userCPUPercent ?? 0) + (dataPoint?.systemCPUPercent ?? 0) + (dataPoint?.waitCPUPercent ?? 0) + (dataPoint?.stealCPUPercent ?? 0)), points, cpuSeries, scales.cpu, 'percent')}
                    </div>
                    <div class="chart-panel chart-panel--memory">
                        <h3>Memory</h3>
                        ${renderStackedTimelineChart('Memory', formatRate(latestUsedMemory), points, memorySeries, scales.memory, 'memory')}
                    </div>
                    <div class="chart-panel chart-panel--disk">
                        <h3>Disk</h3>
                        ${renderStackedTimelineChart('Disk', formatRate((dataPoint?.readDiskKB ?? 0) + (dataPoint?.writeDiskKB ?? 0)), points, diskSeries, scales.disk, 'rate')}
                    </div>
                    <div class="chart-panel chart-panel--network">
                        <h3>Network</h3>
                        ${renderStackedTimelineChart('Network', formatRate((dataPoint?.receivedNetworkKB ?? 0) + (dataPoint?.transmittedNetworkKB ?? 0)), points, networkSeries, scales.network, 'rate')}
                    </div>
                </section>
            </section>
        </article>
    `;
}
