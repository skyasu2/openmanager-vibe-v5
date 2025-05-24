import type { ServerStatus } from '../types/index'

// 📈 기업 환경 메트릭 및 운영 패턴 분석

// 🕒 비즈니스 시간 기반 부하 패턴
export interface BusinessHourPattern {
  timeRange: string
  pattern: string
  description: string
  expectedLoad: number // 1-10 scale
  criticalSystems: string[]
  commonIssues: string[]
}

export const BUSINESS_HOURS_PATTERNS: BusinessHourPattern[] = [
  {
    timeRange: '09:00-12:00',
    pattern: 'morning_peak',
    description: '업무 시작, DB 부하 증가',
    expectedLoad: 8,
    criticalSystems: ['Database Layer', 'Web Services', 'Authentication'],
    commonIssues: ['로그인 집중', 'DB 커넥션 증가', '캐시 워밍업']
  },
  {
    timeRange: '12:00-13:00',
    pattern: 'lunch_low',
    description: '점심시간, 트래픽 감소',
    expectedLoad: 3,
    criticalSystems: ['Maintenance Systems'],
    commonIssues: ['인덱스 재구성', '임시 테이블 정리']
  },
  {
    timeRange: '13:00-17:00',
    pattern: 'afternoon_peak',
    description: '오후 업무, 최대 부하',
    expectedLoad: 10,
    criticalSystems: ['All Systems', 'API Gateway', 'Load Balancers'],
    commonIssues: ['최대 동시 접속', 'API 부하', '파일 업로드 집중']
  },
  {
    timeRange: '17:00-18:00',
    pattern: 'evening_decline',
    description: '퇴근 시간, 부하 감소',
    expectedLoad: 5,
    criticalSystems: ['Backup Systems'],
    commonIssues: ['세션 정리', '일일 백업 시작']
  },
  {
    timeRange: '18:00-09:00',
    pattern: 'overnight_batch',
    description: '야간 배치 작업',
    expectedLoad: 6,
    criticalSystems: ['Storage Layer', 'Database Layer', 'ETL Processes'],
    commonIssues: ['배치 작업 실행', '데이터 동기화', '시스템 점검']
  }
]

// 🔧 서버별 핵심 프로세스 모니터링
export interface CriticalProcess {
  name: string
  description: string
  normalCpuUsage: number
  normalMemoryUsage: number
  alertThreshold: number
  restartRequired: boolean
}

export const CRITICAL_PROCESSES: Record<string, CriticalProcess[]> = {
  k8s_master: [
    {
      name: 'kube-apiserver',
      description: 'Kubernetes API 서버',
      normalCpuUsage: 15,
      normalMemoryUsage: 512,
      alertThreshold: 80,
      restartRequired: true
    },
    {
      name: 'etcd',
      description: '클러스터 상태 저장소',
      normalCpuUsage: 8,
      normalMemoryUsage: 256,
      alertThreshold: 70,
      restartRequired: false
    },
    {
      name: 'kube-scheduler',
      description: 'Pod 스케줄러',
      normalCpuUsage: 5,
      normalMemoryUsage: 128,
      alertThreshold: 60,
      restartRequired: true
    }
  ],
  k8s_worker: [
    {
      name: 'kubelet',
      description: 'Node Agent',
      normalCpuUsage: 10,
      normalMemoryUsage: 256,
      alertThreshold: 75,
      restartRequired: true
    },
    {
      name: 'containerd',
      description: '컨테이너 런타임',
      normalCpuUsage: 12,
      normalMemoryUsage: 512,
      alertThreshold: 80,
      restartRequired: false
    },
    {
      name: 'kube-proxy',
      description: '네트워크 프록시',
      normalCpuUsage: 3,
      normalMemoryUsage: 64,
      alertThreshold: 50,
      restartRequired: true
    }
  ],
  database: [
    {
      name: 'postgres',
      description: 'PostgreSQL 데이터베이스',
      normalCpuUsage: 25,
      normalMemoryUsage: 2048,
      alertThreshold: 85,
      restartRequired: false
    },
    {
      name: 'pg_stat_activity',
      description: 'DB 활성 세션 모니터',
      normalCpuUsage: 2,
      normalMemoryUsage: 32,
      alertThreshold: 30,
      restartRequired: false
    }
  ],
  web_app: [
    {
      name: 'nginx',
      description: '웹 서버',
      normalCpuUsage: 8,
      normalMemoryUsage: 128,
      alertThreshold: 60,
      restartRequired: true
    },
    {
      name: 'java',
      description: 'Java 애플리케이션',
      normalCpuUsage: 35,
      normalMemoryUsage: 1024,
      alertThreshold: 80,
      restartRequired: false
    },
    {
      name: 'tomcat',
      description: 'Tomcat 서버',
      normalCpuUsage: 20,
      normalMemoryUsage: 512,
      alertThreshold: 75,
      restartRequired: true
    }
  ],
  monitoring: [
    {
      name: 'prometheus',
      description: '메트릭 수집 서버',
      normalCpuUsage: 15,
      normalMemoryUsage: 1024,
      alertThreshold: 70,
      restartRequired: false
    },
    {
      name: 'grafana',
      description: '대시보드 서버',
      normalCpuUsage: 8,
      normalMemoryUsage: 256,
      alertThreshold: 60,
      restartRequired: true
    },
    {
      name: 'node_exporter',
      description: '노드 메트릭 수집기',
      normalCpuUsage: 2,
      normalMemoryUsage: 32,
      alertThreshold: 20,
      restartRequired: true
    }
  ]
}

// 📊 실시간 성능 메트릭 분석
export interface PerformanceMetrics {
  timestamp: string
  systemLoad: number
  networkThroughput: number
  diskIoUtilization: number
  activeConnections: number
  responseTime: number
  errorRate: number
}

export const getCurrentPerformanceMetrics = (): PerformanceMetrics => {
  const now = new Date()
  const hour = now.getHours()
  
  // 현재 시간에 따른 부하 패턴 적용
  let baseLoad = 5
  if (hour >= 9 && hour < 12) baseLoad = 8      // 오전 피크
  else if (hour >= 12 && hour < 13) baseLoad = 3 // 점심 시간
  else if (hour >= 13 && hour < 17) baseLoad = 10 // 오후 피크
  else if (hour >= 17 && hour < 18) baseLoad = 5  // 퇴근 시간
  else baseLoad = 6 // 야간 배치
  
  // 현재 장애 상황 반영
  const failureMultiplier = 1.8 // 현재 장애로 인한 부하 증가
  
  return {
    timestamp: now.toISOString(),
    systemLoad: Math.min(baseLoad * failureMultiplier, 10),
    networkThroughput: baseLoad * 10.5, // MB/s
    diskIoUtilization: baseLoad * 8.7,
    activeConnections: baseLoad * 125,
    responseTime: baseLoad * failureMultiplier * 45, // ms
    errorRate: baseLoad * failureMultiplier * 0.8 // %
  }
}

// 🎯 SLA 및 성능 목표
export const SLA_TARGETS = {
  availability: {
    target: 99.9, // 99.9%
    current: 97.2, // 현재 장애로 인한 감소
    monthlyDowntimeAllowed: 43.8, // 분
    currentMonthlyDowntime: 180, // 분 (목표 초과)
  },
  responseTime: {
    target: 100, // ms
    current: 280, // ms (장애로 인한 증가)
    p95Target: 200, // ms
    currentP95: 450 // ms
  },
  throughput: {
    target: 1000, // requests/sec
    current: 680, // requests/sec (장애로 인한 감소)
    peakCapacity: 2500, // requests/sec
    currentCapacityUtilization: 0.72 // 72%
  },
  errorRate: {
    target: 0.1, // %
    current: 2.8, // % (장애로 인한 증가)
    criticalThreshold: 1.0, // %
    warningThreshold: 0.5 // %
  }
}

// 📈 용량 계획 및 확장 권장사항
export interface CapacityPlan {
  component: string
  currentUsage: number
  targetUsage: number
  scalingTrigger: number
  recommendedAction: string
  timeline: string
  cost: string
}

export const CAPACITY_PLANNING: CapacityPlan[] = [
  {
    component: 'Database Master',
    currentUsage: 96.8,
    targetUsage: 70,
    scalingTrigger: 80,
    recommendedAction: '읽기 전용 레플리카 추가 배치',
    timeline: '즉시',
    cost: '월 $500'
  },
  {
    component: 'Storage System',
    currentUsage: 96.8,
    targetUsage: 75,
    scalingTrigger: 85,
    recommendedAction: '스토리지 용량 50% 확장',
    timeline: '24시간 내',
    cost: '월 $800'
  },
  {
    component: 'K8s Worker Nodes',
    currentUsage: 84.7,
    targetUsage: 65,
    scalingTrigger: 75,
    recommendedAction: '워커 노드 2대 추가',
    timeline: '1주일 내',
    cost: '월 $1200'
  },
  {
    component: 'Load Balancers',
    currentUsage: 45.2,
    targetUsage: 60,
    scalingTrigger: 70,
    recommendedAction: '현재 용량 충분',
    timeline: '모니터링 지속',
    cost: '추가 비용 없음'
  }
]

// 🔄 자동화 및 운영 효율성 지표
export const AUTOMATION_METRICS = {
  automatedIncidentResponse: 0.23, // 23% 자동 대응
  meanTimeToDetection: 3.2, // 분
  meanTimeToResolution: 45.7, // 분
  falsePositiveRate: 0.12, // 12%
  automatedRecoverySuccess: 0.78, // 78%
  manualInterventionRequired: 0.34, // 34%
  preventiveActionsTriggered: 0.67, // 67%
  maintenanceWindowCompliance: 0.91 // 91%
}

// 🌡️ 환경별 임계값 설정
export const ENVIRONMENT_THRESHOLDS = {
  production: {
    cpu: { warning: 70, critical: 85 },
    memory: { warning: 75, critical: 90 },
    disk: { warning: 80, critical: 95 },
    network: { warning: 70, critical: 90 },
    latency: { warning: 100, critical: 200 }, // ms
    errorRate: { warning: 0.5, critical: 1.0 } // %
  },
  staging: {
    cpu: { warning: 80, critical: 95 },
    memory: { warning: 85, critical: 95 },
    disk: { warning: 85, critical: 95 },
    network: { warning: 80, critical: 95 },
    latency: { warning: 200, critical: 500 },
    errorRate: { warning: 1.0, critical: 2.0 }
  },
  development: {
    cpu: { warning: 90, critical: 98 },
    memory: { warning: 90, critical: 98 },
    disk: { warning: 90, critical: 98 },
    network: { warning: 90, critical: 98 },
    latency: { warning: 500, critical: 1000 },
    errorRate: { warning: 2.0, critical: 5.0 }
  }
} 