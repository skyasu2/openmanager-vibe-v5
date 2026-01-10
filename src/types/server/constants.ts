/**
 * Server Constants
 *
 * 서버 타입 정의 상수, 장애 영향 그래프
 */

import type { ServerTypeDefinition } from './config';
import type { ServerRole } from './types';

/**
 * 서버 타입별 정의
 */
export const SERVER_TYPE_DEFINITIONS: Record<ServerRole, ServerTypeDefinition> =
  {
    web: {
      type: 'web',
      tags: ['nginx', 'apache', 'frontend', 'http'],
      characteristics: {
        cpuWeight: 0.7,
        memoryWeight: 0.5,
        diskWeight: 0.3,
        networkWeight: 1.2,
        responseTimeBase: 120,
        stabilityFactor: 0.8,
      },
      failureProne: ['high_traffic', 'ssl_issues', 'frontend_errors'],
      dependencies: ['api', 'cache'],
    },
    api: {
      type: 'api',
      tags: ['node', 'nginx', 'express', 'fastapi', 'rest', 'graphql'],
      characteristics: {
        cpuWeight: 0.8,
        memoryWeight: 0.6,
        diskWeight: 0.4,
        networkWeight: 1.0,
        responseTimeBase: 200,
        stabilityFactor: 0.7,
      },
      failureProne: ['memory_leak', 'connection_timeout', 'rate_limit'],
      dependencies: ['database', 'cache'],
    },
    database: {
      type: 'database',
      tags: ['postgres', 'mysql', 'mongodb', 'read/write_heavy'],
      characteristics: {
        cpuWeight: 0.6,
        memoryWeight: 0.9,
        diskWeight: 1.0,
        networkWeight: 0.8,
        responseTimeBase: 50,
        stabilityFactor: 0.9,
      },
      failureProne: ['disk_full', 'slow_queries', 'connection_pool_exhausted'],
      dependencies: ['storage'],
    },
    cache: {
      type: 'cache',
      tags: ['redis', 'memcached', 'in-memory'],
      characteristics: {
        cpuWeight: 0.4,
        memoryWeight: 1.2,
        diskWeight: 0.2,
        networkWeight: 1.1,
        responseTimeBase: 20,
        stabilityFactor: 0.8,
      },
      failureProne: ['memory_eviction', 'cache_miss_spike'],
      dependencies: [],
    },
    storage: {
      type: 'storage',
      tags: ['nfs', 'netapp', 'slow_iops', 'backup'],
      characteristics: {
        cpuWeight: 0.3,
        memoryWeight: 0.4,
        diskWeight: 1.2,
        networkWeight: 0.6,
        responseTimeBase: 500,
        stabilityFactor: 0.6,
      },
      failureProne: ['disk_full', 'io_bottleneck', 'hardware_failure'],
      dependencies: [],
    },
    'load-balancer': {
      type: 'load-balancer',
      tags: ['nginx', 'haproxy', 'traefik', 'ingress'],
      characteristics: {
        cpuWeight: 0.6,
        memoryWeight: 0.4,
        diskWeight: 0.2,
        networkWeight: 1.3,
        responseTimeBase: 80,
        stabilityFactor: 0.8,
      },
      failureProne: ['backend_unavailable', 'ssl_certificate_expired'],
      dependencies: ['web', 'api'],
    },
    backup: {
      type: 'backup',
      tags: ['backup', 'archive', 'scheduled'],
      characteristics: {
        cpuWeight: 0.4,
        memoryWeight: 0.3,
        diskWeight: 1.1,
        networkWeight: 0.7,
        responseTimeBase: 1000,
        stabilityFactor: 0.9,
      },
      failureProne: ['backup_failure', 'storage_corruption'],
      dependencies: ['storage', 'database'],
    },
    monitoring: {
      type: 'monitoring',
      tags: ['prometheus', 'grafana', 'metrics', 'logging'],
      characteristics: {
        cpuWeight: 0.5,
        memoryWeight: 0.6,
        diskWeight: 0.8,
        networkWeight: 0.9,
        responseTimeBase: 300,
        stabilityFactor: 0.85,
      },
      failureProne: ['disk_space', 'network_issues'],
      dependencies: [],
    },
    security: {
      type: 'security',
      tags: ['firewall', 'auth', 'ssl', 'security'],
      characteristics: {
        cpuWeight: 0.3,
        memoryWeight: 0.4,
        diskWeight: 0.5,
        networkWeight: 1.1,
        responseTimeBase: 100,
        stabilityFactor: 0.9,
      },
      failureProne: ['cert_expiry', 'auth_failure'],
      dependencies: [],
    },
    queue: {
      type: 'queue',
      tags: ['redis', 'rabbitmq', 'queue', 'jobs'],
      characteristics: {
        cpuWeight: 0.6,
        memoryWeight: 0.7,
        diskWeight: 0.4,
        networkWeight: 0.8,
        responseTimeBase: 50,
        stabilityFactor: 0.8,
      },
      failureProne: ['queue_overflow', 'worker_timeout'],
      dependencies: [],
    },
    app: {
      type: 'app',
      tags: ['application', 'service', 'microservice', 'app'],
      characteristics: {
        cpuWeight: 0.7,
        memoryWeight: 0.6,
        diskWeight: 0.5,
        networkWeight: 0.9,
        responseTimeBase: 150,
        stabilityFactor: 0.7,
      },
      failureProne: ['application_crash', 'memory_leak', 'timeout'],
      dependencies: ['api', 'database'],
    },
    fallback: {
      type: 'fallback',
      tags: ['backup', 'secondary', 'emergency', 'fallback'],
      characteristics: {
        cpuWeight: 0.8,
        memoryWeight: 0.7,
        diskWeight: 0.6,
        networkWeight: 1.0,
        responseTimeBase: 250,
        stabilityFactor: 0.9,
      },
      failureProne: ['backup_system_overload', 'fallback_activation'],
      dependencies: ['api', 'database'],
    },
    log: {
      type: 'log',
      tags: ['logging', 'elk', 'splunk', 'logs'],
      characteristics: {
        cpuWeight: 0.5,
        memoryWeight: 0.6,
        diskWeight: 1.1,
        networkWeight: 0.7,
        responseTimeBase: 200,
        stabilityFactor: 0.85,
      },
      failureProne: ['disk_full', 'log_rotation_failure', 'parsing_errors'],
      dependencies: ['storage'],
    },
    loadbalancer: {
      type: 'load-balancer',
      tags: ['nginx', 'haproxy', 'traefik', 'ingress'],
      characteristics: {
        cpuWeight: 0.6,
        memoryWeight: 0.4,
        diskWeight: 0.2,
        networkWeight: 1.3,
        responseTimeBase: 80,
        stabilityFactor: 0.8,
      },
      failureProne: ['backend_unavailable', 'ssl_certificate_expired'],
      dependencies: ['web', 'api'],
    },
    application: {
      type: 'app',
      tags: ['application', 'service', 'microservice', 'was', 'jvm'],
      characteristics: {
        cpuWeight: 0.7,
        memoryWeight: 0.8,
        diskWeight: 0.5,
        networkWeight: 0.9,
        responseTimeBase: 180,
        stabilityFactor: 0.7,
      },
      failureProne: ['memory_leak', 'thread_pool_exhausted', 'heap_overflow'],
      dependencies: ['database', 'cache'],
    },
  };

/**
 * 장애 영향 그래프
 */
export const FAILURE_IMPACT_GRAPH: Record<ServerRole, ServerRole[]> = {
  web: ['api', 'load-balancer'],
  api: ['database', 'cache'],
  database: ['api', 'backup'],
  cache: ['api', 'web'],
  monitoring: ['security'],
  security: ['web', 'api'],
  backup: ['storage'],
  'load-balancer': ['web'],
  queue: ['api', 'database'],
  storage: ['database', 'backup'],
  app: ['api', 'database', 'queue'],
  fallback: ['api', 'database'],
  log: ['storage', 'monitoring'],
  loadbalancer: ['web', 'api'],
  application: ['database', 'cache', 'api'],
};
