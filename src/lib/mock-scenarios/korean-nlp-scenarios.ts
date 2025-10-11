/**
 * 🇰🇷 한국어 NLP 엣지 케이스 및 산업별 시나리오
 *
 * 실제 운영 환경에서 발생 가능한 다양한 한국어 처리 케이스
 */

export interface KoreanNLPScenario {
  id: string;
  category: 'technical' | 'business' | 'mixed' | 'edge-case';
  industry?: 'it' | 'finance' | 'healthcare' | 'ecommerce' | 'general';
  input: string;
  expectedIntent: string;
  expectedEntities: Record<string, unknown>;
  context?: Record<string, unknown>;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

/**
 * 기술 용어 혼용 케이스
 * 한국어와 영어 기술 용어가 섞인 복잡한 쿼리
 */
export const TECHNICAL_MIXED_CASES: KoreanNLPScenario[] = [
  {
    id: 'tech-mixed-1',
    category: 'technical',
    industry: 'it',
    input:
      'web-prd-01 서버의 CPU utilization이 90% 넘었는데 load average는 어떻게 되나요?',
    expectedIntent: 'check_server_metrics',
    expectedEntities: {
      server_id: 'web-prd-01',
      metrics: ['cpu_utilization', 'load_average'],
      threshold: { value: 90, unit: 'percent' },
    },
    difficulty: 'medium',
  },
  {
    id: 'tech-mixed-2',
    category: 'technical',
    industry: 'it',
    input:
      'k8s 클러스터에서 pod가 계속 CrashLoopBackOff 상태인데 로그 좀 보여줘',
    expectedIntent: 'show_kubernetes_logs',
    expectedEntities: {
      platform: 'kubernetes',
      resource: 'pod',
      status: 'CrashLoopBackOff',
      action: 'show_logs',
    },
    difficulty: 'hard',
  },
  {
    id: 'tech-mixed-3',
    category: 'technical',
    industry: 'it',
    input:
      'Redis에서 memory fragmentation ratio가 높은데 이거 어떻게 해결하지?',
    expectedIntent: 'troubleshoot_redis',
    expectedEntities: {
      service: 'redis',
      metric: 'memory_fragmentation_ratio',
      issue_type: 'high_value',
      request_type: 'solution',
    },
    difficulty: 'expert',
  },
  {
    id: 'tech-mixed-4',
    category: 'technical',
    industry: 'it',
    input: 'API 서버 TPS가 떨어지고 있는데 DB connection pool 상태 확인해줘',
    expectedIntent: 'check_performance_issue',
    expectedEntities: {
      server_type: 'api',
      metric: 'tps',
      trend: 'decreasing',
      check_target: 'db_connection_pool',
    },
    difficulty: 'medium',
  },
];

/**
 * 비즈니스 용어 케이스
 * 비즈니스 맥락에서의 시스템 모니터링 요청
 */
export const BUSINESS_CONTEXT_CASES: KoreanNLPScenario[] = [
  {
    id: 'biz-1',
    category: 'business',
    industry: 'ecommerce',
    input: '블랙프라이데이 때문에 주문 서버 스케일링 필요한지 확인해주세요',
    expectedIntent: 'check_scaling_needs',
    expectedEntities: {
      event: '블랙프라이데이',
      server_purpose: 'order_processing',
      action: 'check_scaling',
    },
    context: {
      business_event: 'black_friday',
      expected_traffic: 'high',
    },
    difficulty: 'medium',
  },
  {
    id: 'biz-2',
    category: 'business',
    industry: 'finance',
    input: '정산 배치가 돌 시간인데 DB 서버 상태 괜찮나요?',
    expectedIntent: 'check_server_before_batch',
    expectedEntities: {
      batch_type: 'settlement',
      timing: 'scheduled',
      target: 'database_server',
    },
    context: {
      batch_schedule: 'daily',
      critical_level: 'high',
    },
    difficulty: 'easy',
  },
  {
    id: 'biz-3',
    category: 'business',
    industry: 'healthcare',
    input: '환자 데이터 백업 서버의 복제 지연시간이 얼마나 되나요?',
    expectedIntent: 'check_replication_lag',
    expectedEntities: {
      data_type: 'patient_data',
      server_role: 'backup',
      metric: 'replication_lag',
    },
    context: {
      compliance: 'HIPAA',
      sensitivity: 'high',
    },
    difficulty: 'medium',
  },
];

/**
 * 복잡한 복합 쿼리 케이스
 * 여러 의도가 섞인 복잡한 요청
 */
export const COMPLEX_MIXED_CASES: KoreanNLPScenario[] = [
  {
    id: 'complex-1',
    category: 'mixed',
    input:
      '어제 3시부터 5시 사이에 API 응답 시간이 느렸다는데 그 시간대 CPU랑 메모리 사용률 그래프로 보여주고 로그에 에러 있었는지도 확인해줘',
    expectedIntent: 'analyze_past_incident',
    expectedEntities: {
      time_range: {
        date: 'yesterday',
        start: '15:00',
        end: '17:00',
      },
      issue: 'slow_api_response',
      metrics_requested: ['cpu', 'memory'],
      visualization: 'graph',
      additional_check: 'error_logs',
    },
    difficulty: 'hard',
  },
  {
    id: 'complex-2',
    category: 'mixed',
    input:
      '지금 웹서버 3대 중에 하나만 CPU가 높은데 로드밸런서 설정이 잘못된 건지 아니면 특정 요청이 몰리는 건지 분석해줘',
    expectedIntent: 'diagnose_load_imbalance',
    expectedEntities: {
      server_group: 'web_servers',
      total_count: 3,
      issue: 'uneven_cpu_usage',
      possible_causes: ['load_balancer_config', 'request_concentration'],
    },
    difficulty: 'expert',
  },
  {
    id: 'complex-3',
    category: 'mixed',
    input:
      'SSL 인증서 만료일이 다가오는 서버들 목록이랑 각 서버별로 언제 갱신해야 하는지 정리해서 보여줘',
    expectedIntent: 'ssl_certificate_management',
    expectedEntities: {
      check_type: 'ssl_expiry',
      output_format: 'list_with_dates',
      action: 'show_renewal_schedule',
    },
    difficulty: 'medium',
  },
];

/**
 * 엣지 케이스 - 특수한 상황들
 */
export const EDGE_CASES: KoreanNLPScenario[] = [
  {
    id: 'edge-1',
    category: 'edge-case',
    input: 'ㅅㅂ 서버 또 죽었네',
    expectedIntent: 'server_down_alert',
    expectedEntities: {
      emotion: 'frustrated',
      issue: 'server_down',
      severity: 'critical',
    },
    difficulty: 'hard',
  },
  {
    id: 'edge-2',
    category: 'edge-case',
    input: '서버가 좀 이상한데... 뭔가 느린 것 같기도 하고 아닌 것 같기도 하고',
    expectedIntent: 'vague_performance_issue',
    expectedEntities: {
      certainty: 'low',
      issue_type: 'performance',
      specific_metric: 'unknown',
    },
    difficulty: 'expert',
  },
  {
    id: 'edge-3',
    category: 'edge-case',
    input: '그... 어제 말한 그 서버 있잖아 그거 확인 좀',
    expectedIntent: 'check_referenced_server',
    expectedEntities: {
      reference: 'previous_context',
      time_reference: 'yesterday',
      action: 'check_status',
    },
    context: {
      requires_conversation_history: true,
    },
    difficulty: 'expert',
  },
  {
    id: 'edge-4',
    category: 'edge-case',
    input: '!!!긴급!!! 모든 서버 다운됨 빨리 확인!!!',
    expectedIntent: 'emergency_all_servers_down',
    expectedEntities: {
      urgency: 'critical',
      scope: 'all_servers',
      status: 'down',
    },
    difficulty: 'easy',
  },
];

/**
 * 줄임말 및 은어 케이스
 */
export const ABBREVIATION_SLANG_CASES: KoreanNLPScenario[] = [
  {
    id: 'abbr-1',
    category: 'technical',
    input: '디비 커넥션 풀 확인 ㄱㄱ',
    expectedIntent: 'check_db_connection_pool',
    expectedEntities: {
      target: 'database_connection_pool',
      action: 'check',
      urgency: 'immediate',
    },
    difficulty: 'easy',
  },
  {
    id: 'abbr-2',
    category: 'technical',
    input: '오토스케일링 설정 ㅇㅋ?',
    expectedIntent: 'confirm_autoscaling_setup',
    expectedEntities: {
      feature: 'autoscaling',
      question_type: 'confirmation',
    },
    difficulty: 'medium',
  },
  {
    id: 'abbr-3',
    category: 'technical',
    input: '메모리 사용률 80프로 넘으면 알람 설정 plz',
    expectedIntent: 'set_memory_alert',
    expectedEntities: {
      metric: 'memory_usage',
      threshold: 80,
      unit: 'percent',
      action: 'set_alert',
    },
    difficulty: 'easy',
  },
];

/**
 * 오타 및 맞춤법 오류 케이스
 */
export const TYPO_CASES: KoreanNLPScenario[] = [
  {
    id: 'typo-1',
    category: 'edge-case',
    input: '서버 사앹 확인햊주세요',
    expectedIntent: 'check_server_status',
    expectedEntities: {
      typo_corrected: '서버 상태 확인해주세요',
      action: 'check_status',
    },
    difficulty: 'medium',
  },
  {
    id: 'typo-2',
    category: 'edge-case',
    input: 'cpu 사용유ㅜㄹ이 너무 높아여',
    expectedIntent: 'high_cpu_alert',
    expectedEntities: {
      metric: 'cpu_usage',
      issue: 'too_high',
    },
    difficulty: 'medium',
  },
];

/**
 * 시나리오 평가 함수
 */
export function evaluateNLPResult(
  scenario: KoreanNLPScenario,
  actualIntent: string,
  actualEntities: Record<string, unknown>
): {
  intentMatch: boolean;
  entityMatchScore: number;
  missingEntities: string[];
  extraEntities: string[];
} {
  const intentMatch = actualIntent === scenario.expectedIntent;

  const expectedKeys = Object.keys(scenario.expectedEntities);
  const actualKeys = Object.keys(actualEntities);

  const missingEntities = expectedKeys.filter(
    (key) => !actualKeys.includes(key)
  );
  const extraEntities = actualKeys.filter((key) => !expectedKeys.includes(key));

  let matchedEntities = 0;
  expectedKeys.forEach((key) => {
    if (actualKeys.includes(key)) {
      const expected = scenario.expectedEntities[key];
      const actual = actualEntities[key];

      if (JSON.stringify(expected) === JSON.stringify(actual)) {
        matchedEntities++;
      } else if (typeof expected === typeof actual) {
        matchedEntities += 0.5; // 부분 점수
      }
    }
  });

  const entityMatchScore =
    expectedKeys.length > 0 ? matchedEntities / expectedKeys.length : 1;

  return {
    intentMatch,
    entityMatchScore,
    missingEntities,
    extraEntities,
  };
}

/**
 * 난이도별 시나리오 필터링
 */
export function getScenariosByDifficulty(
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
): KoreanNLPScenario[] {
  const allScenarios = [
    ...TECHNICAL_MIXED_CASES,
    ...BUSINESS_CONTEXT_CASES,
    ...COMPLEX_MIXED_CASES,
    ...EDGE_CASES,
    ...ABBREVIATION_SLANG_CASES,
    ...TYPO_CASES,
  ];

  return allScenarios.filter((s) => s.difficulty === difficulty);
}

/**
 * 산업별 시나리오 필터링
 */
export function getScenariosByIndustry(
  industry: 'it' | 'finance' | 'healthcare' | 'ecommerce' | 'general'
): KoreanNLPScenario[] {
  const allScenarios = [...TECHNICAL_MIXED_CASES, ...BUSINESS_CONTEXT_CASES];

  return allScenarios.filter((s) => s.industry === industry);
}

/**
 * 랜덤 시나리오 생성기
 */
export function generateRandomKoreanQuery(): KoreanNLPScenario {
  const templates = [
    '{server} 서버의 {metric} 확인해줘',
    '{time} 동안 {issue} 발생한 서버 목록 보여줘',
    '{metric}이/가 {threshold} 넘은 서버들 {action}해줘',
    '{service}에서 {problem} 발생했는데 원인 분석해줘',
  ];

  const servers = ['web-001', 'api-002', 'db-003', 'cache-001'];
  const metrics = ['CPU', '메모리', '디스크', '네트워크'];
  const times = ['지난 1시간', '어제', '오늘 오전', '최근 24시간'];
  const issues = ['에러', '타임아웃', '재시작', '연결 실패'];
  const thresholds = ['80%', '90%', '100MB/s', '1000ms'];
  const actions = ['재시작', '모니터링', '알림 설정', '스케일링'];
  const services = ['Redis', 'MySQL', 'Nginx', 'Docker'];
  const problems = ['응답 지연', '연결 거부', '메모리 부족', '높은 부하'];

  const template = templates[Math.floor(Math.random() * templates.length)];
  if (!template) {
    return {
      id: `generated-${Date.now()}`,
      category: 'technical',
      input: '시스템 상태 확인 요청',
      expectedIntent: 'generated_query',
      expectedEntities: {},
      difficulty: 'easy',
    };
  }

  const serverItem = servers[Math.floor(Math.random() * servers.length)] ?? '웹서버';
  const metricItem = metrics[Math.floor(Math.random() * metrics.length)] ?? 'CPU';
  const timeItem = times[Math.floor(Math.random() * times.length)] ?? '지난 시간';
  const issueItem = issues[Math.floor(Math.random() * issues.length)] ?? '성능 저하';
  const thresholdItem = thresholds[Math.floor(Math.random() * thresholds.length)] ?? '80%';
  const actionItem = actions[Math.floor(Math.random() * actions.length)] ?? '확인';
  const serviceItem = services[Math.floor(Math.random() * services.length)] ?? 'Redis';
  const problemItem = problems[Math.floor(Math.random() * problems.length)] ?? '응답 지연';

  const input = template
    .replace('{server}', serverItem)
    .replace('{metric}', metricItem)
    .replace('{time}', timeItem)
    .replace('{issue}', issueItem)
    .replace('{threshold}', thresholdItem)
    .replace('{action}', actionItem)
    .replace('{service}', serviceItem)
    .replace('{problem}', problemItem);

  return {
    id: `generated-${Date.now()}`,
    category: 'technical',
    input,
    expectedIntent: 'generated_query',
    expectedEntities: {},
    difficulty: 'medium',
  };
}
