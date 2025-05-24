import type { ServerStatus } from '../types/index'

// 🏢 기본 서버 구성 - 30개 서버
export const DUMMY_SERVERS: ServerStatus[] = [
  // 🐳 Kubernetes 클러스터 (10대)
  {
    id: 'k8s-master-01',
    name: 'k8s-master-01.local',
    status: 'error',
    lastUpdate: new Date(Date.now() - 120000).toISOString(),
    location: '데이터센터-A 랙-01',
    uptime: 1728000,
    metrics: {
      cpu: 92.4,
      memory: 87.8,
      disk: 45.2,
      network: {
        bytesIn: 8388608,
        bytesOut: 12582912,
        packetsIn: 1500,
        packetsOut: 1200,
        latency: 85,
        connections: 245
      },
      processes: 178,
      loadAverage: [2.15, 2.08, 1.95] as const
    }
  },
  {
    id: 'k8s-master-02',
    name: 'k8s-master-02.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 30000).toISOString(),
    location: '데이터센터-A 랙-02',
    uptime: 1728000,
    metrics: {
      cpu: 34.7,
      memory: 52.1,
      disk: 38.9,
      network: {
        bytesIn: 5242880,
        bytesOut: 7340032,
        packetsIn: 980,
        packetsOut: 850,
        latency: 12,
        connections: 156
      },
      processes: 145,
      loadAverage: [0.65, 0.58, 0.42] as const
    }
  },
  {
    id: 'k8s-master-03',
    name: 'k8s-master-03.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 45000).toISOString(),
    location: '데이터센터-A 랙-03',
    uptime: 1728000,
    metrics: {
      cpu: 41.2,
      memory: 58.4,
      disk: 42.1,
      network: {
        bytesIn: 6291456,
        bytesOut: 8388608,
        packetsIn: 1100,
        packetsOut: 950,
        latency: 15,
        connections: 189
      },
      processes: 152,
      loadAverage: [0.78, 0.65, 0.48] as const
    }
  },
  {
    id: 'k8s-worker-01',
    name: 'k8s-worker-01.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 25000).toISOString(),
    location: '데이터센터-B 랙-01',
    uptime: 1296000,
    metrics: {
      cpu: 67.3,
      memory: 73.8,
      disk: 28.4,
      network: {
        bytesIn: 20971520,
        bytesOut: 15728640,
        packetsIn: 3200,
        packetsOut: 2800,
        latency: 8,
        connections: 324
      },
      processes: 198,
      loadAverage: [1.12, 0.98, 0.85] as const
    }
  },
  {
    id: 'k8s-worker-02',
    name: 'k8s-worker-02.local',
    status: 'warning',
    lastUpdate: new Date(Date.now() - 90000).toISOString(),
    location: '데이터센터-B 랙-02',
    uptime: 864000,
    metrics: {
      cpu: 89.2,
      memory: 84.7,
      disk: 56.3,
      network: {
        bytesIn: 31457280,
        bytesOut: 26214400,
        packetsIn: 4800,
        packetsOut: 4200,
        latency: 45,
        connections: 412
      },
      processes: 267,
      loadAverage: [1.78, 1.65, 1.52] as const
    }
  },
  {
    id: 'k8s-worker-03',
    name: 'k8s-worker-03.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 35000).toISOString(),
    location: '데이터센터-B 랙-03',
    uptime: 1296000,
    metrics: {
      cpu: 54.6,
      memory: 68.2,
      disk: 31.7,
      network: {
        bytesIn: 18874368,
        bytesOut: 14155776,
        packetsIn: 2900,
        packetsOut: 2500,
        latency: 10,
        connections: 287
      },
      processes: 185,
      loadAverage: [0.89, 0.76, 0.62] as const
    }
  },
  {
    id: 'k8s-worker-04',
    name: 'k8s-worker-04.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 40000).toISOString(),
    location: '데이터센터-B 랙-04',
    uptime: 1296000,
    metrics: {
      cpu: 61.8,
      memory: 71.5,
      disk: 26.9,
      network: {
        bytesIn: 22020096,
        bytesOut: 16777216,
        packetsIn: 3400,
        packetsOut: 3000,
        latency: 7,
        connections: 356
      },
      processes: 203,
      loadAverage: [1.05, 0.92, 0.78] as const
    }
  },
  {
    id: 'k8s-worker-05',
    name: 'k8s-worker-05.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 50000).toISOString(),
    location: '데이터센터-B 랙-05',
    uptime: 1296000,
    metrics: {
      cpu: 48.9,
      memory: 64.1,
      disk: 33.2,
      network: {
        bytesIn: 17825792,
        bytesOut: 13631488,
        packetsIn: 2700,
        packetsOut: 2300,
        latency: 9,
        connections: 267
      },
      processes: 172,
      loadAverage: [0.72, 0.65, 0.58] as const
    }
  },
  {
    id: 'k8s-worker-06',
    name: 'k8s-worker-06.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 55000).toISOString(),
    location: '데이터센터-C 랙-01',
    uptime: 1080000,
    metrics: {
      cpu: 58.3,
      memory: 69.7,
      disk: 29.8,
      network: {
        bytesIn: 19922944,
        bytesOut: 15204352,
        packetsIn: 3100,
        packetsOut: 2700,
        latency: 11,
        connections: 298
      },
      processes: 189,
      loadAverage: [0.95, 0.83, 0.69] as const
    }
  },
  {
    id: 'k8s-worker-07',
    name: 'k8s-worker-07.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 20000).toISOString(),
    location: '데이터센터-C 랙-02',
    uptime: 1512000,
    metrics: {
      cpu: 43.5,
      memory: 61.2,
      disk: 35.4,
      network: {
        bytesIn: 16777216,
        bytesOut: 12582912,
        packetsIn: 2600,
        packetsOut: 2200,
        latency: 13,
        connections: 254
      },
      processes: 167,
      loadAverage: [0.68, 0.59, 0.51] as const
    }
  },

  // 🖥️ AWS EC2 인스턴스 (10대)
  {
    id: 'aws-web-01',
    name: 'aws-web-01.amazonaws.com',
    status: 'online',
    lastUpdate: new Date(Date.now() - 15000).toISOString(),
    location: 'AWS ap-northeast-2a',
    uptime: 2592000,
    metrics: {
      cpu: 28.5,
      memory: 45.3,
      disk: 22.7,
      network: {
        bytesIn: 41943040,
        bytesOut: 33554432,
        packetsIn: 6500,
        packetsOut: 5800,
        latency: 5,
        connections: 892
      },
      processes: 124,
      loadAverage: [0.42, 0.38, 0.35] as const
    }
  },
  {
    id: 'aws-web-02',
    name: 'aws-web-02.amazonaws.com',
    status: 'online',
    lastUpdate: new Date(Date.now() - 22000).toISOString(),
    location: 'AWS ap-northeast-2b',
    uptime: 2160000,
    metrics: {
      cpu: 35.8,
      memory: 52.1,
      disk: 28.9,
      network: {
        bytesIn: 38797312,
        bytesOut: 31457280,
        packetsIn: 6200,
        packetsOut: 5500,
        latency: 6,
        connections: 823
      },
      processes: 138,
      loadAverage: [0.56, 0.49, 0.42] as const
    }
  },
  {
    id: 'aws-db-01',
    name: 'aws-db-01.amazonaws.com',
    status: 'warning',
    lastUpdate: new Date(Date.now() - 180000).toISOString(),
    location: 'AWS ap-northeast-2a',
    uptime: 3456000,
    metrics: {
      cpu: 87.3,
      memory: 91.2,
      disk: 78.5,
      network: {
        bytesIn: 134217728,
        bytesOut: 104857600,
        packetsIn: 18500,
        packetsOut: 15200,
        latency: 35,
        connections: 2847
      },
      processes: 267,
      loadAverage: [2.45, 2.12, 1.89] as const
    }
  },
  {
    id: 'aws-db-02',
    name: 'aws-db-02.amazonaws.com',
    status: 'online',
    lastUpdate: new Date(Date.now() - 28000).toISOString(),
    location: 'AWS ap-northeast-2c',
    uptime: 2916000,
    metrics: {
      cpu: 52.7,
      memory: 68.4,
      disk: 45.3,
      network: {
        bytesIn: 89478485,
        bytesOut: 73400320,
        packetsIn: 12300,
        packetsOut: 10800,
        latency: 18,
        connections: 1856
      },
      processes: 198,
      loadAverage: [1.15, 0.98, 0.84] as const
    }
  },
  {
    id: 'aws-cache-01',
    name: 'aws-cache-01.amazonaws.com',
    status: 'online',
    lastUpdate: new Date(Date.now() - 18000).toISOString(),
    location: 'AWS ap-northeast-2a',
    uptime: 1944000,
    metrics: {
      cpu: 23.6,
      memory: 78.9,
      disk: 15.2,
      network: {
        bytesIn: 167772160,
        bytesOut: 134217728,
        packetsIn: 25600,
        packetsOut: 22400,
        latency: 2,
        connections: 5634
      },
      processes: 89,
      loadAverage: [0.34, 0.29, 0.26] as const
    }
  },
  {
    id: 'aws-api-01',
    name: 'aws-api-01.amazonaws.com',
    status: 'online',
    lastUpdate: new Date(Date.now() - 12000).toISOString(),
    location: 'AWS ap-northeast-2b',
    uptime: 1728000,
    metrics: {
      cpu: 64.2,
      memory: 71.8,
      disk: 32.4,
      network: {
        bytesIn: 62914560,
        bytesOut: 52428800,
        packetsIn: 9800,
        packetsOut: 8600,
        latency: 12,
        connections: 1456
      },
      processes: 156,
      loadAverage: [1.28, 1.15, 1.02] as const
    }
  },
  {
    id: 'aws-api-02',
    name: 'aws-api-02.amazonaws.com',
    status: 'online',
    lastUpdate: new Date(Date.now() - 33000).toISOString(),
    location: 'AWS ap-northeast-2c',
    uptime: 2073600,
    metrics: {
      cpu: 58.9,
      memory: 67.3,
      disk: 29.7,
      network: {
        bytesIn: 57671680,
        bytesOut: 48234496,
        packetsIn: 8900,
        packetsOut: 7800,
        latency: 14,
        connections: 1324
      },
      processes: 142,
      loadAverage: [1.18, 1.05, 0.94] as const
    }
  },
  {
    id: 'aws-lb-01',
    name: 'aws-lb-01.amazonaws.com',
    status: 'online',
    lastUpdate: new Date(Date.now() - 8000).toISOString(),
    location: 'AWS ap-northeast-2a',
    uptime: 3888000,
    metrics: {
      cpu: 18.4,
      memory: 35.7,
      disk: 12.8,
      network: {
        bytesIn: 209715200,
        bytesOut: 188743680,
        packetsIn: 35600,
        packetsOut: 32200,
        latency: 3,
        connections: 8945
      },
      processes: 78,
      loadAverage: [0.25, 0.22, 0.19] as const
    }
  },
  {
    id: 'aws-monitor-01',
    name: 'aws-monitor-01.amazonaws.com',
    status: 'online',
    lastUpdate: new Date(Date.now() - 42000).toISOString(),
    location: 'AWS ap-northeast-2b',
    uptime: 2332800,
    metrics: {
      cpu: 31.2,
      memory: 58.6,
      disk: 67.4,
      network: {
        bytesIn: 25165824,
        bytesOut: 20971520,
        packetsIn: 3800,
        packetsOut: 3400,
        latency: 8,
        connections: 567
      },
      processes: 198,
      loadAverage: [0.48, 0.42, 0.37] as const
    }
  },
  {
    id: 'aws-backup-01',
    name: 'aws-backup-01.amazonaws.com',
    status: 'online',
    lastUpdate: new Date(Date.now() - 65000).toISOString(),
    location: 'AWS ap-northeast-2c',
    uptime: 4665600,
    metrics: {
      cpu: 15.8,
      memory: 42.3,
      disk: 89.2,
      network: {
        bytesIn: 12582912,
        bytesOut: 10485760,
        packetsIn: 1800,
        packetsOut: 1600,
        latency: 25,
        connections: 234
      },
      processes: 145,
      loadAverage: [0.22, 0.18, 0.15] as const
    }
  },

  // 🏢 온프레미스 서버 (10대)
  {
    id: 'onprem-web-01',
    name: 'onprem-web-01.corp.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 25000).toISOString(),
    location: '본사 서버실 랙-A1',
    uptime: 5184000,
    metrics: {
      cpu: 42.3,
      memory: 59.7,
      disk: 34.5,
      network: {
        bytesIn: 31457280,
        bytesOut: 26214400,
        packetsIn: 4800,
        packetsOut: 4200,
        latency: 8,
        connections: 756
      },
      processes: 156,
      loadAverage: [0.68, 0.59, 0.52] as const
    }
  },
  {
    id: 'onprem-web-02',
    name: 'onprem-web-02.corp.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 38000).toISOString(),
    location: '본사 서버실 랙-A2',
    uptime: 4752000,
    metrics: {
      cpu: 38.9,
      memory: 55.2,
      disk: 31.8,
      network: {
        bytesIn: 28311552,
        bytesOut: 23068672,
        packetsIn: 4300,
        packetsOut: 3800,
        latency: 9,
        connections: 689
      },
      processes: 142,
      loadAverage: [0.62, 0.55, 0.48] as const
    }
  },
  {
    id: 'onprem-db-01',
    name: 'onprem-db-01.corp.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 15000).toISOString(),
    location: '본사 서버실 랙-B1',
    uptime: 6912000,
    metrics: {
      cpu: 73.5,
      memory: 82.1,
      disk: 56.7,
      network: {
        bytesIn: 104857600,
        bytesOut: 83886080,
        packetsIn: 15600,
        packetsOut: 13200,
        latency: 22,
        connections: 2134
      },
      processes: 234,
      loadAverage: [1.85, 1.67, 1.52] as const
    }
  },
  {
    id: 'onprem-file-01',
    name: 'onprem-file-01.corp.local',
    status: 'warning',
    lastUpdate: new Date(Date.now() - 240000).toISOString(),
    location: '본사 서버실 랙-C1',
    uptime: 7776000,
    metrics: {
      cpu: 19.4,
      memory: 45.8,
      disk: 92.3,
      network: {
        bytesIn: 83886080,
        bytesOut: 67108864,
        packetsIn: 12400,
        packetsOut: 10800,
        latency: 45,
        connections: 1567
      },
      processes: 189,
      loadAverage: [0.35, 0.31, 0.28] as const
    }
  },
  {
    id: 'onprem-mail-01',
    name: 'onprem-mail-01.corp.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 52000).toISOString(),
    location: '본사 서버실 랙-D1',
    uptime: 3456000,
    metrics: {
      cpu: 56.8,
      memory: 67.4,
      disk: 48.3,
      network: {
        bytesIn: 52428800,
        bytesOut: 41943040,
        packetsIn: 7800,
        packetsOut: 6900,
        latency: 15,
        connections: 1234
      },
      processes: 176,
      loadAverage: [1.12, 0.98, 0.87] as const
    }
  },
  {
    id: 'onprem-proxy-01',
    name: 'onprem-proxy-01.corp.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 19000).toISOString(),
    location: '본사 서버실 랙-E1',
    uptime: 2592000,
    metrics: {
      cpu: 28.7,
      memory: 41.3,
      disk: 23.6,
      network: {
        bytesIn: 125829120,
        bytesOut: 104857600,
        packetsIn: 18700,
        packetsOut: 16200,
        latency: 6,
        connections: 3456
      },
      processes: 98,
      loadAverage: [0.45, 0.39, 0.34] as const
    }
  },
  {
    id: 'onprem-backup-01',
    name: 'onprem-backup-01.corp.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 125000).toISOString(),
    location: '본사 서버실 랙-F1',
    uptime: 8640000,
    metrics: {
      cpu: 12.5,
      memory: 35.7,
      disk: 78.9,
      network: {
        bytesIn: 16777216,
        bytesOut: 14155776,
        packetsIn: 2400,
        packetsOut: 2100,
        latency: 35,
        connections: 345
      },
      processes: 167,
      loadAverage: [0.18, 0.15, 0.13] as const
    }
  },
  {
    id: 'onprem-monitor-01',
    name: 'onprem-monitor-01.corp.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 31000).toISOString(),
    location: '본사 서버실 랙-G1',
    uptime: 1944000,
    metrics: {
      cpu: 34.6,
      memory: 52.8,
      disk: 45.7,
      network: {
        bytesIn: 20971520,
        bytesOut: 17825792,
        packetsIn: 3100,
        packetsOut: 2800,
        latency: 12,
        connections: 456
      },
      processes: 145,
      loadAverage: [0.58, 0.52, 0.46] as const
    }
  },
  {
    id: 'onprem-app-01',
    name: 'onprem-app-01.corp.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 44000).toISOString(),
    location: '본사 서버실 랙-H1',
    uptime: 4320000,
    metrics: {
      cpu: 67.2,
      memory: 74.5,
      disk: 41.3,
      network: {
        bytesIn: 73400320,
        bytesOut: 62914560,
        packetsIn: 11200,
        packetsOut: 9800,
        latency: 18,
        connections: 1678
      },
      processes: 203,
      loadAverage: [1.45, 1.32, 1.18] as const
    }
  },
  {
    id: 'onprem-test-01',
    name: 'onprem-test-01.corp.local',
    status: 'online',
    lastUpdate: new Date(Date.now() - 67000).toISOString(),
    location: '본사 서버실 랙-I1',
    uptime: 864000,
    metrics: {
      cpu: 21.8,
      memory: 38.2,
      disk: 28.5,
      network: {
        bytesIn: 10485760,
        bytesOut: 8388608,
        packetsIn: 1500,
        packetsOut: 1300,
        latency: 22,
        connections: 187
      },
      processes: 89,
      loadAverage: [0.32, 0.28, 0.24] as const
    }
  }
]

// 📊 기본 성능 메트릭
export function getCurrentPerformanceMetrics() {
  const servers = DUMMY_SERVERS
  const totalServers = servers.length
  const healthyServers = servers.filter(s => s.status === 'online').length
  const warningServers = servers.filter(s => s.status === 'warning').length
  const criticalServers = servers.filter(s => s.status === 'error').length

  const averageCpu = servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / totalServers
  const averageMemory = servers.reduce((sum, s) => sum + s.metrics.memory, 0) / totalServers
  const averageDisk = servers.reduce((sum, s) => sum + s.metrics.disk, 0) / totalServers
  const totalConnections = servers.reduce((sum, s) => sum + s.metrics.network.connections, 0)

  return {
    totalServers,
    healthyServers,
    warningServers,
    criticalServers,
    healthyPercentage: Math.round((healthyServers / totalServers) * 100),
    averageCpu: Math.round(averageCpu * 10) / 10,
    averageMemory: Math.round(averageMemory * 10) / 10,
    averageDisk: Math.round(averageDisk * 10) / 10,
    totalConnections,
    totalProcesses: servers.reduce((sum, s) => sum + s.metrics.processes, 0),
    averageUptime: Math.round(servers.reduce((sum, s) => sum + s.uptime, 0) / totalServers / 86400),
    networkThroughput: {
      totalBytesIn: servers.reduce((sum, s) => sum + s.metrics.network.bytesIn, 0),
      totalBytesOut: servers.reduce((sum, s) => sum + s.metrics.network.bytesOut, 0)
    }
  }
}

// 🚨 기본 알림 데이터
export const DUMMY_FAILURES = [
  {
    id: 'failure-001',
    type: 'critical',
    origin: 'k8s-master-01.local',
    message: 'etcd 클러스터 동기화 실패 - 리더 선출 지연',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    affectedServices: ['api-server', 'scheduler', 'controller-manager'],
    estimatedImpact: 'high'
  },
  {
    id: 'failure-002',
    type: 'warning',
    origin: 'aws-db-01.amazonaws.com',
    message: 'DB 연결 풀 포화 상태 - 새 연결 대기 중',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    affectedServices: ['api-gateway', 'user-service'],
    estimatedImpact: 'medium'
  },
  {
    id: 'failure-003',
    type: 'warning',
    origin: 'onprem-file-01.corp.local',
    message: '디스크 사용률 90% 초과 - 공간 부족 임박',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    affectedServices: ['file-service', 'backup-service'],
    estimatedImpact: 'medium'
  }
]

// 📈 기본 통계 데이터
export const SERVER_STATS = {
  totalServers: 30,
  kubernetesNodes: 10,
  awsInstances: 10,
  onPremiseServers: 10,
  averageUptime: 3456000, // 40일
  totalCpuCores: 240,
  totalMemoryGB: 960,
  totalStorageTB: 48
}

// 🏢 위치 정보
export const IDC_LOCATIONS = [
  {
    name: '데이터센터-A',
    servers: ['k8s-master-01', 'k8s-master-02', 'k8s-master-03'],
    status: 'critical'
  },
  {
    name: '데이터센터-B',
    servers: ['k8s-worker-01', 'k8s-worker-02', 'k8s-worker-03', 'k8s-worker-04', 'k8s-worker-05'],
    status: 'warning'
  },
  {
    name: '데이터센터-C',
    servers: ['k8s-worker-06', 'k8s-worker-07'],
    status: 'healthy'
  },
  {
    name: 'AWS ap-northeast-2',
    servers: ['aws-web-01', 'aws-web-02', 'aws-db-01', 'aws-db-02', 'aws-cache-01', 'aws-api-01', 'aws-api-02', 'aws-lb-01', 'aws-monitor-01', 'aws-backup-01'],
    status: 'healthy'
  },
  {
    name: '본사 서버실',
    servers: ['onprem-web-01', 'onprem-web-02', 'onprem-db-01', 'onprem-file-01', 'onprem-mail-01', 'onprem-proxy-01', 'onprem-backup-01', 'onprem-monitor-01', 'onprem-app-01', 'onprem-test-01'],
    status: 'warning'
  }
] 