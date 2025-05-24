import type { ServerStatus } from '../types/index'

// 🚨 기업 환경 장애 분석 시스템
// CRITICAL 장애 3개 + WARNING 장애 6개의 연관성 분석

export interface FailureChain {
  id: string
  name: string
  origin: string
  affected: string[]
  severity: 'critical' | 'warning' | 'info'
  description: string
  impact: string
  startTime: string
  estimatedResolution: string
  rootCause: string
  businessImpact: number // 1-10 scale
}

export interface FailureCorrelation {
  primaryFailure: string
  secondaryFailures: string[]
  correlationStrength: number // 0.0-1.0
  propagationTime: number // minutes
  affectedSystems: string[]
}

// 🔴 CRITICAL 장애 체인들 (3개 시작점)
export const CRITICAL_FAILURE_CHAINS: FailureChain[] = [
  {
    id: 'db_master_cascade',
    name: '데이터베이스 마스터 서버 장애',
    origin: 'db-master-01.corp.local',
    affected: ['db-slave-01.corp.local', 'web-app-01.corp.local', 'k8s-worker-06.corp.local'],
    severity: 'critical',
    description: 'PostgreSQL 마스터 서버의 CPU/메모리 과부하로 인한 전체 데이터베이스 계층 영향',
    impact: '전체 애플리케이션 성능 저하 및 서비스 응답 지연',
    startTime: new Date(Date.now() - 1080000).toISOString(), // 18분 전 시작
    estimatedResolution: '45-60분 (쿼리 최적화 및 커넥션 풀 재설정 필요)',
    rootCause: '장시간 실행 쿼리 누적, 커넥션 풀 고갈, 인덱스 최적화 부족',
    businessImpact: 9
  },
  {
    id: 'k8s_control_plane_instability',
    name: '쿠버네티스 Control Plane 불안정',
    origin: 'k8s-master-01.corp.local',
    affected: ['k8s-worker-05.corp.local', 'k8s-worker-09.corp.local'],
    severity: 'critical',
    description: 'etcd 응답 지연과 API Server 메모리 누수로 인한 클러스터 전체 불안정',
    impact: '컨테이너 서비스 재시작 빈발 및 새로운 Pod 스케줄링 지연',
    startTime: new Date(Date.now() - 900000).toISOString(), // 15분 전 시작
    estimatedResolution: '60-90분 (etcd 복구 및 마스터 노드 재시작 필요)',
    rootCause: 'etcd 디스크 I/O 병목, API Server 메모리 누수, 네트워크 지연',
    businessImpact: 8
  },
  {
    id: 'storage_bottleneck_cascade',
    name: '스토리지 시스템 I/O 병목',
    origin: 'storage-server-01.corp.local',
    affected: ['backup-server-01.corp.local', 'file-server-01.corp.local'],
    severity: 'critical',
    description: '디스크 용량 96% 사용률과 I/O 병목으로 인한 스토리지 계층 전체 영향',
    impact: '백업 실패, 파일 서비스 지연, 데이터 처리 작업 중단',
    startTime: new Date(Date.now() - 1500000).toISOString(), // 25분 전 시작
    estimatedResolution: '120-180분 (디스크 정리 및 스토리지 확장 필요)',
    rootCause: '급격한 데이터 증가, 자동 정리 작업 실패, 디스크 용량 모니터링 부족',
    businessImpact: 7
  }
]

// ⚠️ WARNING 장애들 (6개 - 연쇄 영향)
export const WARNING_FAILURES: FailureChain[] = [
  {
    id: 'db_slave_overload',
    name: 'PostgreSQL Slave 과부하',
    origin: 'db-slave-01.corp.local',
    affected: [],
    severity: 'warning',
    description: '마스터 장애로 인한 읽기 트래픽 집중',
    impact: '읽기 전용 쿼리 성능 저하',
    startTime: new Date(Date.now() - 900000).toISOString(),
    estimatedResolution: '마스터 복구 시 자동 해결',
    rootCause: 'db-master-01 장애로 인한 트래픽 재분산',
    businessImpact: 5
  },
  {
    id: 'web_app_timeout',
    name: '웹 애플리케이션 타임아웃',
    origin: 'web-app-01.corp.local',
    affected: [],
    severity: 'warning',
    description: 'DB 마스터 지연으로 인한 웹 서비스 응답 시간 증가',
    impact: '사용자 경험 저하, 페이지 로딩 지연',
    startTime: new Date(Date.now() - 780000).toISOString(),
    estimatedResolution: 'DB 마스터 복구 시 자동 해결',
    rootCause: 'db-master-01 응답 지연으로 인한 연쇄 영향',
    businessImpact: 6
  },
  {
    id: 'k8s_worker_pod_restart',
    name: '쿠버네티스 워커 Pod 재시작',
    origin: 'k8s-worker-05.corp.local',
    affected: [],
    severity: 'warning',
    description: 'Control Plane 불안정으로 인한 Pod 재시작 빈발',
    impact: '서비스 간헐적 중단, 처리 지연',
    startTime: new Date(Date.now() - 720000).toISOString(),
    estimatedResolution: 'K8s 마스터 복구 시 자동 해결',
    rootCause: 'k8s-master-01 etcd 지연으로 인한 연쇄 영향',
    businessImpact: 4
  },
  {
    id: 'k8s_scheduling_delay',
    name: '쿠버네티스 스케줄링 지연',
    origin: 'k8s-worker-09.corp.local',
    affected: [],
    severity: 'warning',
    description: 'Control Plane 불안정으로 인한 새 Pod 스케줄링 지연',
    impact: '배치 작업 지연, 오토스케일링 실패',
    startTime: new Date(Date.now() - 660000).toISOString(),
    estimatedResolution: 'K8s 마스터 복구 시 자동 해결',
    rootCause: 'k8s-master-01 API Server 지연으로 인한 연쇄 영향',
    businessImpact: 4
  },
  {
    id: 'backup_failure',
    name: '백업 시스템 실패',
    origin: 'backup-server-01.corp.local',
    affected: [],
    severity: 'warning',
    description: '스토리지 I/O 병목으로 인한 백업 작업 실패',
    impact: '데이터 백업 누락, 복구 능력 저하',
    startTime: new Date(Date.now() - 1200000).toISOString(),
    estimatedResolution: '스토리지 복구 시 자동 재시작',
    rootCause: 'storage-server-01 I/O 병목으로 인한 연쇄 영향',
    businessImpact: 7
  },
  {
    id: 'nfs_response_delay',
    name: 'NFS 파일 서버 응답 지연',
    origin: 'file-server-01.corp.local',
    affected: [],
    severity: 'warning',
    description: '스토리지 서버 장애로 인한 NFS 성능 저하',
    impact: '파일 접근 지연, 공유 스토리지 성능 저하',
    startTime: new Date(Date.now() - 1080000).toISOString(),
    estimatedResolution: '스토리지 복구 시 자동 해결',
    rootCause: 'storage-server-01 디스크 I/O 병목으로 인한 연쇄 영향',
    businessImpact: 5
  }
]

// 🔗 장애 상관관계 매핑
export const FAILURE_CORRELATIONS: FailureCorrelation[] = [
  {
    primaryFailure: 'db-master-01.corp.local',
    secondaryFailures: ['db-slave-01.corp.local', 'web-app-01.corp.local', 'k8s-worker-06.corp.local'],
    correlationStrength: 0.95,
    propagationTime: 3, // 3분
    affectedSystems: ['Database Layer', 'Web Services', 'Container Platform']
  },
  {
    primaryFailure: 'k8s-master-01.corp.local',
    secondaryFailures: ['k8s-worker-05.corp.local', 'k8s-worker-09.corp.local'],
    correlationStrength: 0.92,
    propagationTime: 5, // 5분
    affectedSystems: ['Kubernetes Cluster', 'Container Workloads']
  },
  {
    primaryFailure: 'storage-server-01.corp.local',
    secondaryFailures: ['backup-server-01.corp.local', 'file-server-01.corp.local'],
    correlationStrength: 0.88,
    propagationTime: 8, // 8분
    affectedSystems: ['Storage Layer', 'Backup Systems', 'File Services']
  }
]

// 📊 장애 통계 및 분석
export const FAILURE_ANALYTICS = {
  totalIncidents: 9,
  criticalIncidents: 3,
  warningIncidents: 6,
  averageResolutionTime: 75, // 평균 75분
  businessImpactScore: 6.2, // 평균 점수
  affectedSystemsCount: 9,
  cascadeFailureRate: 0.67, // 67% 장애가 연쇄 반응
  peakIncidentTime: '09:20 KST', // 업무 시간 트래픽 증가 시점
  estimatedDowntime: 180, // 총 180분 예상 다운타임
  recoveryPriority: [
    'db-master-01.corp.local',      // 1순위: 전체 시스템 영향
    'storage-server-01.corp.local', // 2순위: 데이터 보안 관련
    'k8s-master-01.corp.local'      // 3순위: 컨테이너 플랫폼
  ]
}

// 🕒 장애 타임라인
export const FAILURE_TIMELINE = [
  {
    time: '02:30 KST',
    event: '야간 배치 작업으로 인한 DB 부하 증가',
    severity: 'info',
    servers: ['db-master-01.corp.local']
  },
  {
    time: '03:15 KST',
    event: '스토리지 서버 디스크 부족 알림 (90% 사용률)',
    severity: 'warning',
    servers: ['storage-server-01.corp.local']
  },
  {
    time: '08:45 KST',
    event: '업무 시작으로 인한 트래픽 급증',
    severity: 'info',
    servers: ['전체 시스템']
  },
  {
    time: '09:05 KST',
    event: '스토리지 서버 디스크 96% 도달, I/O 병목 시작',
    severity: 'critical',
    servers: ['storage-server-01.corp.local']
  },
  {
    time: '09:13 KST',
    event: '백업 서버 및 NFS 서버 영향 시작',
    severity: 'warning',
    servers: ['backup-server-01.corp.local', 'file-server-01.corp.local']
  },
  {
    time: '09:20 KST',
    event: 'DB 마스터 서버 성능 저하 시작 (쿼리 누적)',
    severity: 'critical',
    servers: ['db-master-01.corp.local']
  },
  {
    time: '09:23 KST',
    event: 'DB 슬레이브 서버 읽기 부하 집중',
    severity: 'warning',
    servers: ['db-slave-01.corp.local']
  },
  {
    time: '09:25 KST',
    event: '웹 애플리케이션 응답 지연 시작',
    severity: 'warning',
    servers: ['web-app-01.corp.local']
  },
  {
    time: '09:35 KST',
    event: 'K8s Control Plane etcd 응답 지연 시작',
    severity: 'critical',
    servers: ['k8s-master-01.corp.local']
  },
  {
    time: '09:40 KST',
    event: 'K8s 워커 노드들 Pod 재시작 빈발',
    severity: 'warning',
    servers: ['k8s-worker-05.corp.local', 'k8s-worker-09.corp.local']
  },
  {
    time: '현재',
    event: '전체 장애 상황 지속 중 - 복구 작업 진행',
    severity: 'critical',
    servers: ['9개 서버 영향']
  }
]

// 🎯 AI 분석 결과 및 권장사항
export const AI_RECOMMENDATIONS = {
  immediateActions: [
    '🔴 DB 마스터 서버 긴급 쿼리 최적화 및 커넥션 풀 재설정',
    '🔴 스토리지 서버 임시 디스크 정리 및 긴급 용량 확장',
    '🔴 K8s Control Plane etcd 백업 및 재시작 준비'
  ],
  shortTermActions: [
    '⚠️ DB 슬레이브 서버 추가 투입으로 읽기 부하 분산',
    '⚠️ K8s 워커 노드들의 Pod 재배치 및 리소스 최적화',
    '⚠️ 백업 시스템 임시 중단 후 스토리지 복구 우선'
  ],
  longTermActions: [
    '💡 DB 쿼리 성능 모니터링 및 자동 최적화 시스템 구축',
    '💡 스토리지 자동 확장 및 정리 정책 수립',
    '💡 K8s 클러스터 고가용성 강화 (마스터 노드 부하 분산)',
    '💡 장애 연쇄 반응 예측 및 자동 격리 시스템 도입'
  ],
  preventiveActions: [
    '🛡️ 실시간 리소스 임계치 모니터링 강화',
    '🛡️ 자동 백업 시스템 스케줄링 최적화',
    '🛡️ 장애 시뮬레이션 및 복구 테스트 정기 실시',
    '🛡️ 비즈니스 시간 기반 리소스 프로비저닝 자동화'
  ]
} 