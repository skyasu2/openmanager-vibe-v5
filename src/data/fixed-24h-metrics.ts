/**
 * 🎯 24시간 고정 메트릭 데이터 (한국 데이터센터 기반)
 *
 * 서버 존:
 * - ICN: 인천/서울 (메인 데이터센터)
 * - PUS: 부산 (DR 데이터센터)
 *
 * 15개 서버 구성:
 * - 웹서버 (Nginx): 3대
 * - API 서버 (WAS): 3대
 * - 데이터베이스 (MySQL): 3대
 * - 캐시 (Redis): 2대
 * - 스토리지 (NFS/S3): 2대
 * - 로드밸런서 (HAProxy): 2대
 *
 * 24시간 4분할 상시 장애 시나리오 적용
 */

import {
  applyScenario,
  FAILURE_SCENARIOS,
  type ScenarioDefinition,
} from './scenarios';

/**
 * 10분 단위 고정 메트릭
 */
export interface Fixed10MinMetric {
  minuteOfDay: number; // 0, 10, 20, ..., 1430
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  logs: string[]; // 📝 Log Lines Added
}

/**
 * 서버 24시간 데이터셋
 */
export interface Server24hDataset {
  serverId: string;
  serverType:
    | 'web'
    | 'database'
    | 'application'
    | 'storage'
    | 'cache'
    | 'loadbalancer';
  location: string;
  baseline: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  data: Fixed10MinMetric[]; // length 144
}

/**
 * 🎭 실제 시스템 로그 스타일 템플릿
 *
 * AI Agent가 로그 패턴을 분석하여 원인을 추론해야 합니다.
 * 시나리오 이름이나 원인을 직접 노출하지 않습니다.
 */
const REALISTIC_LOG_TEMPLATES: Record<
  string,
  Record<string, { critical: string[]; warning: string[] }>
> = {
  // 🗄️ MySQL 데이터베이스 로그
  database: {
    disk: {
      critical: [
        '[ERROR] InnoDB: Unable to write to datafile /var/lib/mysql/ibdata1',
        '[ERROR] mysqld: Disk full /var/lib/mysql (errcode: 28 - No space left on device)',
        '[WARN] InnoDB: Write to file ./ib_logfile0 failed at offset 1048576',
        '[ERROR] Binary log write failed: MYSQL_BIN_LOG::write_event() returned 1',
        '[WARN] mysqld: Disk is full writing /var/lib/mysql/binlog.000042',
      ],
      warning: [
        '[WARN] InnoDB: Tablespace is getting close to 90% full',
        '[INFO] mysqld: Running disk cleanup on /var/lib/mysql',
        '[WARN] Binary log size exceeds max_binlog_size threshold',
        '[INFO] Slow query: DELETE FROM session_logs took 4.2s (rows_examined: 850000)',
      ],
    },
    memory: {
      critical: [
        '[ERROR] InnoDB: Cannot allocate memory for the buffer pool',
        '[ERROR] mysqld: Out of memory (Needed 268435456 bytes)',
        '[WARN] InnoDB: Buffer pool hit ratio dropped to 45%',
        '[ERROR] Connection refused: too many connections (max: 500)',
      ],
      warning: [
        '[WARN] InnoDB: Buffer pool usage at 88%',
        '[INFO] Slow query: SELECT * FROM orders JOIN... took 3.5s',
        '[WARN] Query cache is disabled, consider enabling for read-heavy workload',
      ],
    },
    cpu: {
      critical: [
        '[WARN] mysqld: CPU utilization exceeds safe threshold',
        '[ERROR] Query timeout: lock wait timeout exceeded',
        '[WARN] InnoDB: Long semaphore wait (> 600 seconds)',
      ],
      warning: [
        '[INFO] Slow query: Complex JOIN operation took 2.8s',
        '[WARN] Table scan detected on large table (rows: 2.5M)',
      ],
    },
    network: {
      critical: [
        '[ERROR] Replication I/O thread: Connection to master lost',
        '[ERROR] Slave SQL thread: Relay log read failure',
      ],
      warning: [
        '[WARN] Replication lag detected: 45 seconds behind master',
        '[INFO] Network timeout on slave connection, retrying...',
      ],
    },
  },

  // 📱 WAS 애플리케이션 로그
  application: {
    memory: {
      critical: [
        '[ERROR] java.lang.OutOfMemoryError: Java heap space',
        '[ERROR] GC overhead limit exceeded - application halted',
        '[WARN] JVM: Full GC took 8.5s, heap 94% used after collection',
        '[ERROR] ThreadPoolExecutor rejected task: pool exhausted',
        '[WARN] Metaspace near limit: 95% of 256MB used',
      ],
      warning: [
        '[WARN] JVM: Minor GC frequency increased (>10/min)',
        '[INFO] Heap usage trending upward: 72% → 78% → 82%',
        '[WARN] Object allocation rate exceeds threshold',
      ],
    },
    cpu: {
      critical: [
        '[ERROR] Thread pool exhausted, all workers busy',
        '[WARN] Request queue depth: 450 (threshold: 100)',
        '[ERROR] Timeout waiting for available worker thread',
      ],
      warning: [
        '[WARN] CPU-intensive operation detected in /api/reports',
        '[INFO] Async task backlog growing: 85 pending',
        '[WARN] Response time degraded: avg 450ms (baseline: 120ms)',
      ],
    },
    disk: {
      critical: [
        '[ERROR] Failed to write application log: No space left on device',
        '[ERROR] Temp file creation failed in /tmp',
      ],
      warning: [
        '[WARN] Log file rotation failed, disk space low',
        '[INFO] Application cache directory cleanup initiated',
      ],
    },
    network: {
      critical: [
        '[ERROR] Connection pool to database exhausted',
        '[ERROR] HTTP client timeout: connection refused to redis:6379',
        '[WARN] Circuit breaker OPEN for service: payment-gateway',
      ],
      warning: [
        '[WARN] Increased latency to downstream service: 380ms avg',
        '[INFO] Retry attempt 3/5 for external API call',
      ],
    },
  },

  // 🌐 Nginx 웹서버 로그
  web: {
    cpu: {
      critical: [
        '[ERROR] nginx: worker_connections are not enough',
        '[WARN] upstream timed out (110: Connection timed out)',
        '[ERROR] Too many open files (24: limit reached)',
      ],
      warning: [
        '[WARN] nginx: worker process CPU high during peak',
        '[INFO] Active connections: 8500 (limit: 10000)',
      ],
    },
    network: {
      critical: [
        '[ERROR] 502 Bad Gateway: upstream prematurely closed connection',
        '[ERROR] SSL_do_handshake() failed (SSL: error:0A000126)',
        '[WARN] upstream: no live upstreams while connecting',
      ],
      warning: [
        '[WARN] High number of 504 Gateway Timeout responses',
        '[INFO] Bandwidth utilization: 890 Mbps / 1 Gbps',
        '[WARN] Connection reset by peer errors increasing',
      ],
    },
    memory: {
      critical: [
        '[ERROR] nginx: failed to allocate memory for request',
        '[WARN] proxy_buffer_size may be too small',
      ],
      warning: [
        '[WARN] Shared memory zone "cache_zone" is almost full',
        '[INFO] Large request body: 15MB processed',
      ],
    },
    disk: {
      critical: [
        '[ERROR] open() "/var/log/nginx/access.log" failed (28: No space)',
        '[ERROR] Cache directory full, caching disabled',
      ],
      warning: [
        '[WARN] Access log file exceeds 2GB, rotation recommended',
        '[INFO] Proxy cache cleanup in progress',
      ],
    },
  },

  // 💾 Redis 캐시 로그
  cache: {
    memory: {
      critical: [
        '[ERROR] Redis: OOM command not allowed when used memory > maxmemory',
        '[ERROR] MISCONF Redis is configured to save RDB snapshots, but is currently unable to persist',
        '[WARN] Redis memory usage: 14.2GB / 15GB (maxmemory)',
        '[ERROR] Client disconnected: OOM during write operation',
      ],
      warning: [
        '[WARN] Memory fragmentation ratio: 1.45 (threshold: 1.5)',
        '[INFO] Evicted 4500 keys due to maxmemory policy',
        '[WARN] Active defragmentation started (ratio: 12%)',
      ],
    },
    cpu: {
      critical: [
        '[WARN] Redis latency spike: 250ms (threshold: 10ms)',
        '[ERROR] Lua script exceeded time limit',
      ],
      warning: [
        '[WARN] Slow log: KEYS pattern took 120ms',
        '[INFO] Background save in progress, latency may increase',
      ],
    },
    network: {
      critical: [
        '[ERROR] Connection refused: max clients reached (10000)',
        '[ERROR] Cluster node unreachable: 192.168.1.45:6379',
      ],
      warning: [
        '[WARN] Replica sync in progress, writes may be delayed',
        '[INFO] Client reconnection storm detected: 500 connects/sec',
      ],
    },
    disk: {
      critical: [
        '[ERROR] BGSAVE failed: No space left on device',
        '[ERROR] AOF rewrite failed: disk full',
      ],
      warning: [
        '[WARN] RDB file size exceeds 5GB, consider cleanup',
        '[INFO] AOF rewrite triggered (file size: 2.1GB)',
      ],
    },
  },

  // 📦 NFS/S3 스토리지 로그
  storage: {
    disk: {
      critical: [
        '[ERROR] nfsd: failed to write file: ENOSPC (No space left)',
        '[ERROR] Quota exceeded for volume /exports/data',
        '[WARN] iSCSI target: LUN nearly full (96% used)',
      ],
      warning: [
        '[WARN] NFS export /data approaching quota limit',
        '[INFO] Storage pool rebalancing in progress',
        '[WARN] Large file write: 45GB single file transfer',
      ],
    },
    network: {
      critical: [
        '[ERROR] NFS: RPC timeout connecting to client',
        '[ERROR] SMB session dropped: network error',
      ],
      warning: [
        '[WARN] NFS lock manager: high lock contention detected',
        '[INFO] S3 upload retry: temporary network issue',
      ],
    },
    memory: {
      critical: ['[ERROR] NFS: unable to allocate memory for readahead'],
      warning: [
        '[WARN] Buffer cache pressure increasing',
        '[INFO] Memory mapped I/O optimization applied',
      ],
    },
    cpu: {
      critical: ['[ERROR] Compression thread pool exhausted'],
      warning: [
        '[WARN] Deduplication CPU usage high during scan',
        '[INFO] RAID parity check in progress (25% complete)',
      ],
    },
  },

  // ⚖️ HAProxy 로드밸런서 로그
  loadbalancer: {
    network: {
      critical: [
        '[ERROR] haproxy: no server available in backend "api_servers"',
        '[ERROR] Connection limit reached (fe_conn: 50000)',
        '[WARN] Health check failed: server api-1 marked DOWN',
      ],
      warning: [
        '[WARN] Backend queue: 150 pending requests',
        '[INFO] Stick-table approaching size limit',
        '[WARN] TLS handshake errors increasing: 0.5%',
      ],
    },
    cpu: {
      critical: [
        '[ERROR] haproxy: cannot allocate SSL context',
        '[WARN] Event loop latency: 85ms (threshold: 10ms)',
      ],
      warning: [
        '[WARN] SSL session cache hit ratio low: 45%',
        '[INFO] Rate limiting activated for client subnet',
      ],
    },
    memory: {
      critical: [
        '[ERROR] haproxy: cannot allocate buffer for connection',
        '[WARN] Stick-table memory usage critical',
      ],
      warning: [
        '[WARN] Connection table 80% full',
        '[INFO] Inactive session cleanup triggered',
      ],
    },
    disk: {
      critical: ['[ERROR] Stats socket write failed: disk full'],
      warning: [
        '[WARN] Log file rotation needed: /var/log/haproxy.log',
        '[INFO] Stats file updated successfully',
      ],
    },
  },
};

/**
 * 정상 상태 로그 템플릿 (서버 타입별)
 */
const NORMAL_LOG_TEMPLATES: Record<string, string[]> = {
  database: [
    '[INFO] InnoDB: Buffer pool(s) load completed at timestamp',
    '[INFO] mysqld: ready for connections. Version: 8.0.35',
    '[INFO] Slave I/O thread: connected to master successfully',
    '[INFO] Query OK, 0 rows affected (0.00 sec)',
  ],
  application: [
    '[INFO] Application started in 2.3s (JVM running for 2.8s)',
    '[INFO] Tomcat started on port(s): 8080 (http)',
    '[INFO] Health check endpoint responding: 200 OK',
    '[DEBUG] Request completed: GET /api/status (4ms)',
  ],
  web: [
    '[INFO] nginx: configuration file /etc/nginx/nginx.conf test is successful',
    '[INFO] nginx: worker process 12345 started',
    '[INFO] Access log: 200 requests/sec, avg latency 12ms',
    '[DEBUG] Upstream response time: 8ms',
  ],
  cache: [
    '[INFO] Redis: DB loaded from disk: 0.234 seconds',
    '[INFO] Redis: Ready to accept connections',
    '[INFO] Keyspace hits: 99.2%, misses: 0.8%',
    '[DEBUG] PING: PONG (latency: 0.1ms)',
  ],
  storage: [
    '[INFO] NFS: exports file reloaded successfully',
    '[INFO] Storage pool status: healthy (all disks online)',
    '[INFO] Backup completed: 45GB transferred in 12 minutes',
    '[DEBUG] I/O operations: 1200 IOPS, latency 2ms',
  ],
  loadbalancer: [
    '[INFO] haproxy: Proxy "frontend" started.',
    '[INFO] haproxy: Server "api-1" is UP, reason: Layer4 check passed',
    '[INFO] Health checks: all backends healthy',
    '[DEBUG] Request routed to backend: api-1 (weight: 100)',
  ],
};

/**
 * 로그 생성기
 * 메트릭 상태와 시나리오에 따라 실제 시스템 로그 스타일의 로그 생성
 *
 * @description AI Agent가 로그 패턴을 분석하여 원인을 추론해야 합니다.
 * 시나리오 이름이나 원인을 직접 노출하지 않습니다.
 */
function generateLogs(
  _serverId: string,
  serverType: string,
  cpu: number,
  memory: number,
  disk: number,
  network: number,
  activeScenario?: ScenarioDefinition
): string[] {
  const logs: string[] = [];

  // 1. 시나리오 기반 실제 로그 생성 (증상만 표시, 원인 비노출)
  if (activeScenario) {
    const typeTemplates = REALISTIC_LOG_TEMPLATES[serverType];
    const metricTemplates = typeTemplates?.[activeScenario.affectedMetric];

    if (metricTemplates) {
      const templateList =
        activeScenario.severity === 'critical'
          ? metricTemplates.critical
          : metricTemplates.warning;

      // 랜덤하게 2-3개 로그 선택 (중복 없이)
      const count = activeScenario.severity === 'critical' ? 3 : 2;
      const shuffled = [...templateList].sort(() => Math.random() - 0.5);
      const selectedLogs = shuffled.slice(0, count);

      // 동적 값 삽입
      selectedLogs.forEach((log) => {
        let processedLog = log;
        // 일부 로그에 실제 메트릭 값 삽입
        if (log.includes('usage:') || log.includes('used:')) {
          const metricValue =
            activeScenario.affectedMetric === 'cpu'
              ? cpu
              : activeScenario.affectedMetric === 'memory'
                ? memory
                : activeScenario.affectedMetric === 'disk'
                  ? disk
                  : network;
          processedLog = log.replace(
            /\d+(\.\d+)?%/,
            `${metricValue.toFixed(1)}%`
          );
        }
        logs.push(processedLog);
      });
    }
  }

  // 2. 메트릭 임계치 기반 보조 로그 (시나리오 없을 때만)
  if (logs.length === 0) {
    if (cpu > 80) {
      logs.push(
        `[WARN] System load average: ${(cpu / 10).toFixed(2)}, ${((cpu - 5) / 10).toFixed(2)}, ${((cpu - 10) / 10).toFixed(2)}`
      );
    }
    if (memory > 85) {
      logs.push(
        `[WARN] Available memory: ${(100 - memory).toFixed(0)}% free (${((100 - memory) * 0.32).toFixed(1)}GB / 32GB)`
      );
    }
    if (disk > 90) {
      logs.push(
        `[WARN] Filesystem /dev/sda1: ${disk.toFixed(0)}% used, ${((100 - disk) * 5).toFixed(0)}GB available`
      );
    }
    if (network > 80) {
      logs.push(
        `[WARN] Network interface eth0: ${(network * 10).toFixed(0)} Mbps / 1000 Mbps`
      );
    }
  }

  // 3. 정상 로그 (로그가 없을 때)
  if (logs.length === 0) {
    const normalLogs = NORMAL_LOG_TEMPLATES[serverType] || [
      '[INFO] Health check passed - latency 4ms',
      '[INFO] System metrics collection successful',
    ];
    const randomLog = normalLogs[Math.floor(Math.random() * normalLogs.length)];
    if (randomLog) logs.push(randomLog);
  }

  return logs;
}

/**
 * 기본 메트릭에 작은 변동 추가 (±5%)
 */
function addVariation(value: number): number {
  const variation = value * (Math.random() - 0.5) * 0.1;
  return Math.max(0, Math.min(100, value + variation));
}

/**
 * 서버별 24시간 데이터 생성
 */
function generateServer24hData(
  serverId: string,
  serverType: Server24hDataset['serverType'],
  location: string,
  baseline: { cpu: number; memory: number; disk: number; network: number }
): Server24hDataset {
  const data: Fixed10MinMetric[] = [];

  for (let i = 0; i < 144; i++) {
    const minuteOfDay = i * 10;

    let cpu = addVariation(baseline.cpu);
    let memory = addVariation(baseline.memory);
    let disk = addVariation(baseline.disk);
    let network = addVariation(baseline.network);

    // 시나리오 적용 확인
    const activeScenario = FAILURE_SCENARIOS.find(
      (s) =>
        s.serverId === serverId &&
        minuteOfDay >= s.timeRange[0] &&
        minuteOfDay <= s.timeRange[1]
    );

    // 시나리오가 있으면 메트릭 변형
    if (activeScenario) {
      cpu = applyScenario(serverId, 'cpu', minuteOfDay, cpu);
      memory = applyScenario(serverId, 'memory', minuteOfDay, memory);
      disk = applyScenario(serverId, 'disk', minuteOfDay, disk);
      network = applyScenario(serverId, 'network', minuteOfDay, network);
    }

    // 로그 생성 (인과관계 적용)
    const logs = generateLogs(
      serverId,
      serverType,
      cpu,
      memory,
      disk,
      network,
      activeScenario
    );

    data.push({
      minuteOfDay,
      cpu: Math.round(cpu * 10) / 10,
      memory: Math.round(memory * 10) / 10,
      disk: Math.round(disk * 10) / 10,
      network: Math.round(network * 10) / 10,
      logs,
    });
  }

  return {
    serverId,
    serverType,
    location,
    baseline,
    data,
  };
}

/**
 * 15개 서버의 24시간 고정 데이터 (한국 데이터센터 기반)
 *
 * 각 시간대별 1 Critical + 2 Warning 상시 유지
 */
export const FIXED_24H_DATASETS: Server24hDataset[] = [
  // ============================================================================
  // 🌐 웹서버 (Nginx) - 3대
  // ============================================================================
  generateServer24hData('web-nginx-icn-01', 'web', 'Seoul-ICN-AZ1', {
    cpu: 30,
    memory: 45,
    disk: 25,
    network: 50,
  }),
  generateServer24hData('web-nginx-icn-02', 'web', 'Seoul-ICN-AZ2', {
    cpu: 35,
    memory: 50,
    disk: 30,
    network: 55,
  }),
  generateServer24hData('web-nginx-pus-01', 'web', 'Busan-PUS-DR', {
    cpu: 25,
    memory: 40,
    disk: 28,
    network: 45,
  }),

  // ============================================================================
  // 📱 API/WAS 서버 (Spring Boot / Node.js) - 3대
  // ============================================================================
  generateServer24hData('api-was-icn-01', 'application', 'Seoul-ICN-AZ1', {
    cpu: 45,
    memory: 60,
    disk: 40,
    network: 50,
  }),
  generateServer24hData('api-was-icn-02', 'application', 'Seoul-ICN-AZ2', {
    cpu: 50,
    memory: 70,
    disk: 45,
    network: 55,
  }),
  generateServer24hData('api-was-pus-01', 'application', 'Busan-PUS-DR', {
    cpu: 35,
    memory: 55,
    disk: 38,
    network: 40,
  }),

  // ============================================================================
  // 🗄️ 데이터베이스 (MySQL) - 3대
  // ============================================================================
  generateServer24hData('db-mysql-icn-primary', 'database', 'Seoul-ICN-AZ1', {
    cpu: 50,
    memory: 70,
    disk: 50,
    network: 45,
  }),
  generateServer24hData('db-mysql-icn-replica', 'database', 'Seoul-ICN-AZ2', {
    cpu: 40,
    memory: 65,
    disk: 48,
    network: 40,
  }),
  generateServer24hData('db-mysql-pus-dr', 'database', 'Busan-PUS-DR', {
    cpu: 25,
    memory: 50,
    disk: 45,
    network: 30,
  }),

  // ============================================================================
  // 💾 캐시 (Redis Cluster) - 2대
  // ============================================================================
  generateServer24hData('cache-redis-icn-01', 'cache', 'Seoul-ICN-AZ1', {
    cpu: 35,
    memory: 80,
    disk: 20,
    network: 60,
  }),
  generateServer24hData('cache-redis-icn-02', 'cache', 'Seoul-ICN-AZ2', {
    cpu: 40,
    memory: 85,
    disk: 25,
    network: 65,
  }),

  // ============================================================================
  // 📦 스토리지 (NFS / S3 Gateway) - 2대
  // ============================================================================
  generateServer24hData('storage-nfs-icn-01', 'storage', 'Seoul-ICN-AZ1', {
    cpu: 20,
    memory: 40,
    disk: 75,
    network: 35,
  }),
  generateServer24hData('storage-s3gw-pus-01', 'storage', 'Busan-PUS-DR', {
    cpu: 15,
    memory: 35,
    disk: 60,
    network: 40,
  }),

  // ============================================================================
  // ⚖️ 로드밸런서 (HAProxy) - 2대
  // ============================================================================
  generateServer24hData('lb-haproxy-icn-01', 'loadbalancer', 'Seoul-ICN-AZ1', {
    cpu: 30,
    memory: 50,
    disk: 15,
    network: 70,
  }),
  generateServer24hData('lb-haproxy-pus-01', 'loadbalancer', 'Busan-PUS-DR', {
    cpu: 25,
    memory: 45,
    disk: 12,
    network: 65,
  }),
];

// ============================================================================
// Helper functions
// ============================================================================

export function getServer24hData(
  serverId: string
): Server24hDataset | undefined {
  return FIXED_24H_DATASETS.find((dataset) => dataset.serverId === serverId);
}

export function getServersByType(
  serverType: Server24hDataset['serverType']
): Server24hDataset[] {
  return FIXED_24H_DATASETS.filter(
    (dataset) => dataset.serverType === serverType
  );
}

export function getServersByLocation(location: string): Server24hDataset[] {
  return FIXED_24H_DATASETS.filter((dataset) =>
    dataset.location.includes(location)
  );
}

export function getDataAtMinute(
  dataset: Server24hDataset,
  minuteOfDay: number
): Fixed10MinMetric | undefined {
  const roundedMinute = Math.floor(minuteOfDay / 10) * 10;
  return dataset.data.find((point) => point.minuteOfDay === roundedMinute);
}

export function getRecentData(
  dataset: Server24hDataset,
  minuteOfDay: number,
  count: number = 6
): Fixed10MinMetric[] {
  const currentSlotIndex = Math.floor(minuteOfDay / 10);
  const result: Fixed10MinMetric[] = [];
  for (let i = 0; i < count; i++) {
    const targetIndex = (((currentSlotIndex - i) % 144) + 144) % 144;
    const dataPoint = dataset.data[targetIndex];
    if (dataPoint) result.push(dataPoint);
  }
  return result;
}

export function calculateAverageMetrics(minuteOfDay: number): {
  avgCpu: number;
  avgMemory: number;
  avgDisk: number;
  avgNetwork: number;
} {
  let totalCpu = 0,
    totalMemory = 0,
    totalDisk = 0,
    totalNetwork = 0,
    count = 0;
  for (const dataset of FIXED_24H_DATASETS) {
    const dataPoint = getDataAtMinute(dataset, minuteOfDay);
    if (dataPoint) {
      totalCpu += dataPoint.cpu;
      totalMemory += dataPoint.memory;
      totalDisk += dataPoint.disk;
      totalNetwork += dataPoint.network;
      count++;
    }
  }
  return {
    avgCpu: count ? Math.round((totalCpu / count) * 10) / 10 : 0,
    avgMemory: count ? Math.round((totalMemory / count) * 10) / 10 : 0,
    avgDisk: count ? Math.round((totalDisk / count) * 10) / 10 : 0,
    avgNetwork: count ? Math.round((totalNetwork / count) * 10) / 10 : 0,
  };
}

/**
 * 서버 인프라 요약 정보
 */
export function getInfrastructureSummary(): {
  totalServers: number;
  byZone: Record<string, number>;
  byType: Record<string, number>;
} {
  const byZone: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const dataset of FIXED_24H_DATASETS) {
    // Zone 집계
    const zone = dataset.location.includes('ICN') ? 'Seoul-ICN' : 'Busan-PUS';
    byZone[zone] = (byZone[zone] || 0) + 1;

    // Type 집계
    byType[dataset.serverType] = (byType[dataset.serverType] || 0) + 1;
  }

  return {
    totalServers: FIXED_24H_DATASETS.length,
    byZone,
    byType,
  };
}
