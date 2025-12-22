/**
 * Server Status Thresholds
 * Single Source of Truth: Synced with Frontend system-rules.json
 *
 * @see /src/config/rules/system-rules.json (Frontend SSOT)
 */

export const STATUS_THRESHOLDS = {
  cpu: {
    warning: 70,
    critical: 85,
  },
  memory: {
    warning: 75,
    critical: 90,
  },
  disk: {
    warning: 80,
    critical: 95,
  },
  network: {
    warning: 70,
    critical: 85,
  },
} as const;

export type MetricType = keyof typeof STATUS_THRESHOLDS;
export type ServerStatus = 'online' | 'warning' | 'critical';

/**
 * Determine server status based on multi-metric thresholds
 * Logic matches Dashboard's RulesLoader.getServerStatus()
 *
 * @param metrics - Server metrics object
 * @returns ServerStatus - 'online' | 'warning' | 'critical'
 */
export function determineServerStatus(metrics: {
  cpu?: number;
  memory?: number;
  disk?: number;
  network?: number;
}): ServerStatus {
  const { cpu = 0, memory = 0, disk = 0, network = 0 } = metrics;

  // Rule 1: ANY metric >= critical → critical
  if (
    cpu >= STATUS_THRESHOLDS.cpu.critical ||
    memory >= STATUS_THRESHOLDS.memory.critical ||
    disk >= STATUS_THRESHOLDS.disk.critical ||
    network >= STATUS_THRESHOLDS.network.critical
  ) {
    return 'critical';
  }

  // Rule 2: ANY metric >= warning → warning
  if (
    cpu >= STATUS_THRESHOLDS.cpu.warning ||
    memory >= STATUS_THRESHOLDS.memory.warning ||
    disk >= STATUS_THRESHOLDS.disk.warning ||
    network >= STATUS_THRESHOLDS.network.warning
  ) {
    return 'warning';
  }

  // Rule 3: ALL metrics < warning → online
  return 'online';
}

/**
 * Get individual metric status
 */
export function getMetricStatus(
  metricType: MetricType,
  value: number
): 'normal' | 'warning' | 'critical' {
  const thresholds = STATUS_THRESHOLDS[metricType];

  if (value >= thresholds.critical) return 'critical';
  if (value >= thresholds.warning) return 'warning';
  return 'normal';
}
