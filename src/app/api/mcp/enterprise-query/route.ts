import { NextRequest, NextResponse } from 'next/server'
import { CacheService } from '../../../../lib/redis'
import { ENTERPRISE_SERVERS, SERVER_STATS } from '../../../../lib/enterprise-servers'
import { 
  CRITICAL_FAILURE_CHAINS, 
  WARNING_FAILURES,
  FAILURE_ANALYTICS,
  AI_RECOMMENDATIONS 
} from '../../../../lib/enterprise-failures'
import { 
  getCurrentPerformanceMetrics,
  SLA_TARGETS,
  CAPACITY_PLANNING 
} from '../../../../lib/enterprise-metrics'

// 🤖 기업 운영팀 자연어 쿼리 처리 시스템
interface MCPQuery {
  query: string
  intent: string
  entities: string[]
  response: string
  confidence: number
  relatedServers: string[]
  actionItems: string[]
}

// 자주 묻는 운영팀 질문 패턴
const COMMON_QUERIES = [
  {
    patterns: ['전체 인프라 상태', '전체 시스템 어때', '인프라 현황', '서버 상태 전체'],
    intent: 'infrastructure_overview',
    handler: getInfrastructureOverview
  },
  {
    patterns: ['데이터베이스', 'db', '디비', '마스터 서버', 'postgresql'],
    intent: 'database_status',
    handler: getDatabaseStatus
  },
  {
    patterns: ['쿠버네티스', 'k8s', '컨테이너', '클러스터', 'kubernetes'],
    intent: 'kubernetes_status',
    handler: getKubernetesStatus
  },
  {
    patterns: ['스토리지', '저장소', '디스크', '용량', 'storage'],
    intent: 'storage_status',
    handler: getStorageStatus
  },
  {
    patterns: ['심각한 장애', '크리티컬', 'critical', '긴급', '장애'],
    intent: 'critical_issues',
    handler: getCriticalIssues
  },
  {
    patterns: ['복구 우선순위', '우선순위', '복구 계획', '해결 순서'],
    intent: 'recovery_priority',
    handler: getRecoveryPriority
  },
  {
    patterns: ['야간 배치', 'batch', '배치 작업', '야간 작업'],
    intent: 'batch_impact',
    handler: getBatchImpact
  },
  {
    patterns: ['성능', 'sla', '응답시간', '가용성', 'performance'],
    intent: 'performance_metrics',
    handler: getPerformanceMetrics
  }
]

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        error: '질문을 입력해주세요.'
      }, { status: 400 })
    }

    // 쿼리 정규화
    const normalizedQuery = query.toLowerCase().trim()
    
    // 캐시 확인
    const cacheKey = `mcp:query:${Buffer.from(normalizedQuery).toString('base64')}`
    const cached = await CacheService.get<MCPQuery>(cacheKey)
    
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        timestamp: new Date().toISOString(),
        cached: true
      })
    }

    // 의도 분석 및 핸들러 매칭
    let matchedHandler = null
    let intent = 'general'
    let confidence = 0

    for (const queryPattern of COMMON_QUERIES) {
      for (const pattern of queryPattern.patterns) {
        if (normalizedQuery.includes(pattern)) {
          matchedHandler = queryPattern.handler
          intent = queryPattern.intent
          confidence = 0.9
          break
        }
      }
      if (matchedHandler) break
    }

    // 기본 핸들러
    if (!matchedHandler) {
      matchedHandler = getGeneralResponse
      confidence = 0.5
    }

    // 응답 생성
    const response = await matchedHandler(normalizedQuery)
    
    const mcpResponse: MCPQuery = {
      query: query,
      intent,
      entities: extractEntities(normalizedQuery),
      response: response.answer,
      confidence,
      relatedServers: response.relatedServers,
      actionItems: response.actionItems
    }

    // 캐시에 저장 (5분)
    await CacheService.set(cacheKey, mcpResponse, 300)

    return NextResponse.json({
      success: true,
      data: mcpResponse,
      timestamp: new Date().toISOString(),
      cached: false
    })

  } catch (error) {
    console.error('MCP Query API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process query',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 🔧 각 의도별 응답 핸들러 함수들

async function getInfrastructureOverview(query: string) {
  const criticalCount = SERVER_STATS.critical
  const warningCount = SERVER_STATS.warning
  const healthyCount = SERVER_STATS.healthy
  const totalCount = SERVER_STATS.total

  const healthPercentage = Math.round((healthyCount / totalCount) * 100)
  
  return {
    answer: `🏢 **전체 인프라 현황**

📊 **서버 상태 요약:**
- 전체 서버: ${totalCount}대 (K8s ${SERVER_STATS.kubernetes}대 + 온프레미스 ${SERVER_STATS.onpremise}대)
- 🟢 정상: ${healthyCount}대 (${healthPercentage}%)
- 🟡 경고: ${warningCount}대 (${Math.round((warningCount/totalCount)*100)}%)
- 🔴 심각: ${criticalCount}대 (${Math.round((criticalCount/totalCount)*100)}%)

🚨 **현재 주요 이슈:**
${criticalCount > 0 ? `- ${criticalCount}건의 심각한 장애 발생 중` : '- 심각한 장애 없음'}
${warningCount > 0 ? `- ${warningCount}건의 경고 상황 진행 중` : ''}

💡 **권장 조치:** ${healthPercentage < 80 ? '즉시 장애 대응 필요' : '모니터링 지속'}`,
    relatedServers: ENTERPRISE_SERVERS.filter(s => s.status !== 'online').map(s => s.id),
    actionItems: criticalCount > 0 ? AI_RECOMMENDATIONS.immediateActions : ['정기 모니터링 지속']
  }
}

async function getDatabaseStatus(query: string) {
  const dbServers = ENTERPRISE_SERVERS.filter(s => s.id.includes('db-'))
  const dbMaster = dbServers.find(s => s.id === 'db-master-01')
  const dbSlaves = dbServers.filter(s => s.id.includes('slave'))
  
  const criticalDB = CRITICAL_FAILURE_CHAINS.find(c => c.origin === 'db-master-01.corp.local')
  
  return {
    answer: `🗄️ **데이터베이스 계층 상태**

📊 **DB 서버 현황:**
- 마스터 서버: ${dbMaster?.status === 'error' ? '🔴 심각한 장애' : dbMaster?.status === 'warning' ? '🟡 경고' : '🟢 정상'}
- 슬레이브 서버: ${dbSlaves.length}대 중 ${dbSlaves.filter(s => s.status === 'online').length}대 정상

${criticalDB ? `🚨 **긴급 상황:**
- ${criticalDB.name}
- 영향: ${criticalDB.impact}
- 예상 복구 시간: ${criticalDB.estimatedResolution}
- 비즈니스 영향도: ${criticalDB.businessImpact}/10` : '🟢 **정상 운영 중**'}

🔧 **현재 메트릭:**
- CPU: ${dbMaster?.metrics.cpu}%
- 메모리: ${dbMaster?.metrics.memory}%
- 활성 커넥션: ${dbMaster?.metrics.network.connections}개`,
    relatedServers: dbServers.map(s => s.id),
    actionItems: criticalDB ? [
      'DB 마스터 서버 긴급 최적화',
      '커넥션 풀 재설정',
      '긴 쿼리 분석 및 중단'
    ] : ['정기 성능 모니터링']
  }
}

async function getKubernetesStatus(query: string) {
  const k8sServers = ENTERPRISE_SERVERS.filter(s => s.id.includes('k8s-'))
  const masters = k8sServers.filter(s => s.id.includes('master'))
  const workers = k8sServers.filter(s => s.id.includes('worker'))
  
  const k8sCritical = CRITICAL_FAILURE_CHAINS.find(c => c.origin === 'k8s-master-01.corp.local')
  
  return {
    answer: `☸️ **Kubernetes 클러스터 상태**

🎛️ **Control Plane:**
- 마스터 노드: ${masters.length}대 중 ${masters.filter(m => m.status === 'online').length}대 정상
- ${k8sCritical ? '🔴 etcd 응답 지연 발생' : '🟢 API Server 정상'}

👥 **Worker Nodes:**
- 전체 워커: ${workers.length}대
- 정상: ${workers.filter(w => w.status === 'online').length}대
- 경고/장애: ${workers.filter(w => w.status !== 'online').length}대

${k8sCritical ? `🚨 **클러스터 이슈:**
- ${k8sCritical.description}
- Pod 재시작 빈발 및 스케줄링 지연
- 예상 복구: ${k8sCritical.estimatedResolution}` : ''}

🔄 **워크로드 분산:**
- 프론트엔드: 4개 노드
- 백엔드 API: 4개 노드  
- 데이터 처리: 4개 노드`,
    relatedServers: k8sServers.map(s => s.id),
    actionItems: k8sCritical ? [
      'etcd 백업 및 재시작',
      'API Server 메모리 누수 점검',
      '영향받는 Pod 재배치'
    ] : ['클러스터 상태 모니터링']
  }
}

async function getStorageStatus(query: string) {
  const storageServers = ENTERPRISE_SERVERS.filter(s => 
    s.id.includes('storage') || s.id.includes('file') || s.id.includes('backup')
  )
  
  const storageCritical = CRITICAL_FAILURE_CHAINS.find(c => c.origin === 'storage-server-01.corp.local')
  
  return {
    answer: `💾 **스토리지 시스템 상태**

📁 **스토리지 계층:**
- MinIO 오브젝트 스토리지: ${storageCritical ? '🔴 디스크 96% 사용률' : '🟢 정상'}
- NFS 파일 서버: ${ENTERPRISE_SERVERS.find(s => s.id === 'file-server-01')?.status === 'warning' ? '🟡 응답 지연' : '🟢 정상'}
- 백업 시스템: ${ENTERPRISE_SERVERS.find(s => s.id === 'backup-server-01')?.status === 'warning' ? '🟡 백업 실패' : '🟢 정상'}

${storageCritical ? `🚨 **긴급 상황:**
- 디스크 용량 96.8% 사용률
- I/O 병목 현상 발생
- 백업 및 파일 서비스 연쇄 영향
- 예상 복구: ${storageCritical.estimatedResolution}` : ''}

📊 **용량 현황:**
- 사용률: ${ENTERPRISE_SERVERS.find(s => s.id === 'storage-server-01')?.metrics.disk}%
- I/O 처리량: 120MB/s (과부하)`,
    relatedServers: storageServers.map(s => s.id),
    actionItems: storageCritical ? [
      '임시 디스크 정리 작업',
      '스토리지 용량 긴급 확장',
      '백업 시스템 임시 중단'
    ] : ['용량 모니터링 지속']
  }
}

async function getCriticalIssues(query: string) {
  return {
    answer: `🚨 **현재 심각한 장애 현황**

🔴 **CRITICAL 장애 ${CRITICAL_FAILURE_CHAINS.length}건:**

${CRITICAL_FAILURE_CHAINS.map((chain, index) => `
**${index + 1}. ${chain.name}**
- 📍 장애 서버: ${chain.origin}
- 🕒 발생 시각: ${new Date(chain.startTime).toLocaleString('ko-KR')}
- 📈 영향도: ${chain.businessImpact}/10
- 🔗 연쇄 영향: ${chain.affected.length}개 서버
- ⏱️ 예상 복구: ${chain.estimatedResolution}
`).join('')}

⚠️ **연쇄 영향:** ${WARNING_FAILURES.length}개 서버 추가 영향

🎯 **복구 우선순위:**
1. ${FAILURE_ANALYTICS.recoveryPriority[0]} (전체 시스템 영향)
2. ${FAILURE_ANALYTICS.recoveryPriority[1]} (데이터 보안)
3. ${FAILURE_ANALYTICS.recoveryPriority[2]} (컨테이너 플랫폼)`,
    relatedServers: CRITICAL_FAILURE_CHAINS.flatMap(c => [c.origin, ...c.affected]),
    actionItems: AI_RECOMMENDATIONS.immediateActions
  }
}

async function getRecoveryPriority(query: string) {
  return {
    answer: `🔧 **복구 우선순위 계획**

🎯 **즉시 조치 (0-30분):**
${AI_RECOMMENDATIONS.immediateActions.map(action => `- ${action}`).join('\n')}

⚠️ **단기 조치 (30분-2시간):**
${AI_RECOMMENDATIONS.shortTermActions.map(action => `- ${action}`).join('\n')}

💡 **장기 계획 (1일-1주):**
${AI_RECOMMENDATIONS.longTermActions.map(action => `- ${action}`).join('\n')}

📊 **영향도 기준 우선순위:**
1. DB 마스터 (영향도 9/10) - 전체 애플리케이션
2. 스토리지 시스템 (영향도 7/10) - 데이터 보안
3. K8s Control Plane (영향도 8/10) - 컨테이너 서비스`,
    relatedServers: FAILURE_ANALYTICS.recoveryPriority,
    actionItems: [...AI_RECOMMENDATIONS.immediateActions, ...AI_RECOMMENDATIONS.shortTermActions]
  }
}

async function getBatchImpact(query: string) {
  return {
    answer: `🌙 **야간 배치 작업 영향 분석**

⏰ **현재 시간대:** ${new Date().getHours() >= 18 || new Date().getHours() < 9 ? '야간 시간대' : '업무 시간대'}

📊 **배치 작업 상황:**
- 현재 부하 패턴: overnight_batch
- 예상 시스템 부하: 6/10
- 주요 영향 시스템: Storage Layer, Database Layer

🚨 **현재 장애와의 연관성:**
- 02:30 야간 배치 시작으로 DB 부하 증가
- 03:15 스토리지 용량 경고 시작
- 09:20 업무 시간 트래픽과 겹치며 장애 본격화

💡 **권장사항:**
- 배치 작업 일시 중단 또는 연기
- 리소스 집약적 작업 우선 정지
- 시스템 복구 후 배치 재시작`,
    relatedServers: ['db-master-01', 'storage-server-01'],
    actionItems: [
      '현재 실행 중인 배치 작업 점검',
      '리소스 집약적 작업 중단',
      '배치 스케줄 임시 조정'
    ]
  }
}

async function getPerformanceMetrics(query: string) {
  const metrics = getCurrentPerformanceMetrics()
  
  return {
    answer: `📈 **실시간 성능 지표**

🎯 **SLA 목표 대비 현황:**
- 가용성: ${SLA_TARGETS.availability.current}% (목표: ${SLA_TARGETS.availability.target}%) ❌
- 응답시간: ${SLA_TARGETS.responseTime.current}ms (목표: ${SLA_TARGETS.responseTime.target}ms) ❌
- 처리량: ${SLA_TARGETS.throughput.current} req/s (목표: ${SLA_TARGETS.throughput.target} req/s) ❌
- 오류율: ${SLA_TARGETS.errorRate.current}% (목표: ${SLA_TARGETS.errorRate.target}%) ❌

📊 **현재 시스템 메트릭:**
- 전체 시스템 부하: ${metrics.systemLoad}/10
- 네트워크 처리량: ${metrics.networkThroughput.toFixed(1)} MB/s
- 디스크 I/O 사용률: ${metrics.diskIoUtilization.toFixed(1)}%
- 활성 연결: ${metrics.activeConnections}개

⚠️ **상태:** 현재 장애로 인해 모든 SLA 목표 미달성`,
    relatedServers: ENTERPRISE_SERVERS.filter(s => s.status !== 'online').map(s => s.id),
    actionItems: [
      '즉시 장애 복구로 SLA 정상화',
      '성능 지표 실시간 모니터링 강화',
      '용량 확장 계획 검토'
    ]
  }
}

async function getGeneralResponse(query: string) {
  return {
    answer: `❓ **일반 문의 응답**

죄송합니다. "${query}" 질문을 정확히 이해하지 못했습니다.

🤖 **사용 가능한 질문 유형:**
- "전체 인프라 상태 어때?"
- "데이터베이스 서버 문제 있어?"
- "쿠버네티스 클러스터 상태는?"
- "스토리지 용량 부족해?"
- "심각한 장애 몇 개 발생 중?"
- "복구 우선순위 알려줘"
- "야간 배치 작업 영향 있나?"
- "현재 성능 지표 어때?"

💡 **도움말:** 구체적인 시스템명이나 상태를 언급하시면 더 정확한 답변을 드릴 수 있습니다.`,
    relatedServers: [],
    actionItems: ['구체적인 질문 재입력 권장']
  }
}

// 엔티티 추출 함수
function extractEntities(query: string): string[] {
  const entities = []
  
  // 서버 관련 엔티티
  if (query.includes('데이터베이스') || query.includes('db')) entities.push('database')
  if (query.includes('쿠버네티스') || query.includes('k8s')) entities.push('kubernetes')
  if (query.includes('스토리지') || query.includes('저장소')) entities.push('storage')
  if (query.includes('웹') || query.includes('web')) entities.push('web')
  
  // 상태 관련 엔티티
  if (query.includes('장애') || query.includes('문제')) entities.push('issue')
  if (query.includes('성능') || query.includes('속도')) entities.push('performance')
  if (query.includes('용량') || query.includes('디스크')) entities.push('capacity')
  
  return entities
} 