# 🤖 OpenManager v5 - AI 에이전트 가이드

**버전**: v5.13.5  
**최종 업데이트**: 2024-12-28  
**핵심 기술**: MCP (Model Context Protocol) + 하이브리드 AI 엔진  

---

## 🎯 AI 에이전트 개요

OpenManager v5의 AI 에이전트는 **MCP(Model Context Protocol) 기반의 지능형 도구 오케스트레이션 시스템**입니다. 자연어 질의를 6개의 전문화된 도구로 자동 변환하여 실시간 서버 분석, 이상 탐지, 최적화 제안을 수행합니다.

## 🛠️ 개발 환경에서의 MCP 활용

### 🔧 현재 Cursor AI에서 활용 중인 MCP 서버들

#### 📁 **mcp_filesystem-server** (파일 시스템 조작)
```typescript
// 현재 활용 중인 핵심 기능들
interface CurrentMCPUsage {
  'read_file': '소스코드 분석 및 내용 파악',
  'edit_file': '기존 파일의 정밀한 라인별 수정',
  'write_file': '새 파일 생성 및 전체 내용 교체',
  'list_directory': '프로젝트 구조 탐색',
  'search_files': '파일명 기반 빠른 검색',
  'create_directory': '새 디렉토리 생성',
  'move_file': '파일 이동 및 이름 변경'
}

// 실제 활용 예시
const developmentWorkflow = {
  codeAnalysis: 'read_file로 기존 코드 이해',
  documentUpdate: 'edit_file로 정밀한 문서 수정',
  structureExploration: 'list_directory로 프로젝트 구조 파악',
  fileManagement: 'create_directory, move_file로 파일 정리'
};
```

#### 🔍 **코드베이스 분석 도구들**
```typescript
interface CodeAnalysisTools {
  'codebase_search': {
    usage: '의미론적 코드 검색',
    example: 'MCP protocol implementation current usage',
    benefit: '자연어로 관련 코드 블록 찾기'
  },
  'grep_search': {
    usage: '정규식 기반 정확한 텍스트 검색',
    example: '특정 함수명이나 변수명 검색',
    benefit: '정확한 매칭으로 빠른 코드 위치 파악'
  },
  'file_search': {
    usage: '퍼지 파일명 검색',
    example: '일부만 기억하는 파일명으로 검색',
    benefit: '불완전한 정보로도 파일 찾기'
  }
}
```

#### ⚡ **터미널 통합**
```bash
# 현재 활용 중인 터미널 명령들
npm install                  # 의존성 설치
npm run dev                 # 개발 서버 실행
git add . && git commit     # Git 작업
find . -name "*.md"         # 파일 검색
lsof -ti:3001              # 포트 관리
```

### 🚀 **향후 활용 가능한 MCP 확장 기능들**

#### 1. **🔄 Git MCP 서버** (git-mcp-server)
```typescript
interface ProposedGitMCP {
  features: [
    '브랜치 관리 자동화',
    '커밋 메시지 자동 생성',
    'PR 생성 및 관리',
    '충돌 해결 지원',
    '코드 리뷰 자동화'
  ],
  benefits: [
    '더 효율적인 Git 워크플로우',
    '일관된 커밋 메시지 품질',
    '자동화된 PR 관리'
  ]
}
```

#### 2. **🗄️ 데이터베이스 MCP 서버** (postgres-mcp-server)
```typescript
interface ProposedDatabaseMCP {
  features: [
    'PostgreSQL 스키마 자동 분석',
    'SQL 쿼리 최적화 제안',
    '마이그레이션 스크립트 자동 생성',
    '인덱스 최적화 권장',
    '성능 병목 지점 분석'
  ],
  benefits: [
    'DB 설계 품질 향상',
    '성능 최적화 자동화',
    '안전한 스키마 변경'
  ]
}
```

#### 3. **🧪 테스팅 MCP 서버** (testing-mcp-server)
```typescript
interface ProposedTestingMCP {
  features: [
    '자동 테스트 케이스 생성',
    'API 엔드포인트 자동 테스트',
    '성능 테스트 시나리오 생성',
    'E2E 테스트 스크립트 자동화',
    '테스트 커버리지 분석'
  ],
  benefits: [
    '테스트 작성 시간 단축',
    '더 포괄적인 테스트 커버리지',
    '자동화된 품질 보증'
  ]
}
```

#### 4. **📊 DevOps MCP 서버** (docker-k8s-mcp-server)
```typescript
interface ProposedDevOpsMCP {
  features: [
    'Docker 이미지 최적화',
    'Kubernetes 매니페스트 생성',
    '배포 전략 자동화',
    '로그 분석 및 모니터링',
    '리소스 사용량 최적화'
  ],
  benefits: [
    '배포 프로세스 간소화',
    '인프라 관리 자동화',
    '운영 효율성 향상'
  ]
}
```

### 💡 **MCP 기반 개발 워크플로우 최적화**

#### 현재 활용 패턴
```typescript
const currentWorkflow = {
  step1: 'codebase_search로 관련 코드 탐색',
  step2: 'read_file로 상세 내용 분석', 
  step3: 'edit_file로 정밀한 수정',
  step4: 'run_terminal_cmd로 테스트 실행',
  step5: 'Git 명령으로 커밋/푸시'
};
```

#### 향후 이상적인 워크플로우
```typescript
const optimizedWorkflow = {
  step1: 'AI가 요구사항 분석 및 코드 탐색',
  step2: 'Git MCP로 브랜치 자동 생성',
  step3: 'Testing MCP로 테스트 케이스 자동 생성',
  step4: 'Database MCP로 스키마 변경 검증',
  step5: 'DevOps MCP로 배포 준비 자동화',
  step6: 'Git MCP로 PR 자동 생성 및 리뷰 요청'
};
```

## 🧠 MCP 아키텍처

### 전체 MCP 시스템 구조
```
❓ 자연어 질의 입력
  ↓
🎯 MCP Orchestrator (도구 선택)
  ↓
🔄 Context Manager (컨텍스트 분석)
  ↓
🐍 Python ML Engine ⚡ TypeScript Fallback
  ↓
📊 6개 전문화 도구 실행
  ↓
🔗 결과 통합 및 권장사항
  ↓
💬 자연어 응답 생성
```

### 6개 전문화 도구
```typescript
const MCPTools = {
  'statistical_analysis': {
    description: '서버 메트릭 통계 분석',
    capabilities: ['평균/표준편차', '트렌드 분석', '성능 지표'],
    useCase: '전반적인 시스템 성능 분석'
  },
  'anomaly_detection': {
    description: '실시간 이상 탐지',
    capabilities: ['패턴 기반 탐지', 'ML 이상값 분석', '91% 정확도'],
    useCase: '장애 예측 및 조기 감지'
  },
  'time_series_forecast': {
    description: '시계열 데이터 예측',
    capabilities: ['미래 트렌드 예측', '용량 계획', '리소스 예측'],
    useCase: '용량 계획 및 스케일링 결정'
  },
  'pattern_recognition': {
    description: '패턴 인식 및 분류',
    capabilities: ['행동 패턴 학습', '정상/비정상 분류', '패턴 매칭'],
    useCase: '반복적인 문제 패턴 식별'
  },
  'root_cause_analysis': {
    description: '근본 원인 분석',
    capabilities: ['의존성 분석', '영향도 계산', '원인 추적'],
    useCase: '장애 발생 시 근본 원인 파악'
  },
  'optimization_advisor': {
    description: '성능 최적화 조언',
    capabilities: ['리소스 최적화', '설정 권장', '비용 절감'],
    useCase: '시스템 성능 개선 제안'
  }
};
```

## 🎮 AI 에이전트 사용법

### 1. 기본 사용법

#### 웹 인터페이스
1. **AI 에이전트 오픈**: 우상단 "AI 에이전트" 버튼 클릭
2. **자연어 질의**: 한국어로 질문 입력
3. **실시간 분석**: 사고 과정 실시간 표시
4. **결과 확인**: 분석 결과 및 권장사항 확인

#### 예시 질의
```
✅ 좋은 질의 예시:
"현재 CPU 사용률이 높은 서버들을 분석해주세요"
"최근 1시간 동안 메모리 사용 패턴을 확인해주세요"
"서버 성능 최적화 방안을 제안해주세요"
"이상한 네트워크 트래픽이 있는지 확인해주세요"

❌ 피해야 할 질의:
"안녕하세요" (분석 요청이 명확하지 않음)
"서버" (구체적인 분석 요청이 없음)
```

### 2. 고급 기능

#### 컨텍스트 인식 분석
```typescript
// AI 에이전트는 다음 컨텍스트를 자동 인식합니다:
interface AIContext {
  currentTime: '업무시간/야간 자동 감지',
  systemLoad: '현재 시스템 부하 상태',
  recentEvents: '최근 발생한 이벤트들',
  userHistory: '사용자 이전 질의 히스토리',
  urgencyLevel: '긴급도 자동 판단'
}
```

#### 다중 도구 조합 분석
```
📊 복합 분석 예시:
"시스템 전체 성능을 분석하고 최적화 방안을 제안해주세요"

→ 실행되는 도구들:
1. statistical_analysis (전체 성능 통계)
2. anomaly_detection (이상 상황 탐지)
3. pattern_recognition (성능 패턴 분석)
4. optimization_advisor (최적화 제안)
```

## 🔧 API 사용법

### 1. 직접 API 호출

#### 기본 MCP API
```bash
POST /api/ai/mcp
Content-Type: application/json

{
  "query": "CPU 사용률 급증 원인 분석",
  "parameters": {
    "metrics": {
      "cpu": [45, 67, 89, 95, 92],
      "memory": [60, 65, 70, 75, 80],
      "timestamp": "2025-05-31T10:00:00Z"
    }
  },
  "context": {
    "session_id": "analysis_session_123",
    "urgency": "high",
    "user_role": "admin"
  }
}
```

#### 응답 형식
```json
{
  "success": true,
  "analysis_id": "mcp_analysis_456",
  "tools_used": ["statistical_analysis", "anomaly_detection"],
  "execution_time": 1.2,
  "results": {
    "summary": "CPU 사용률이 평상시 대비 40% 증가했습니다.",
    "findings": [
      {
        "tool": "statistical_analysis",
        "result": "평균 CPU: 75.6%, 표준편차: 18.2",
        "confidence": 0.95
      },
      {
        "tool": "anomaly_detection", 
        "result": "90% 이상 CPU 사용률이 비정상 패턴으로 감지됨",
        "confidence": 0.91
      }
    ],
    "recommendations": [
      "워크로드 분산 검토 필요",
      "메모리 누수 가능성 확인",
      "프로세스별 CPU 사용량 모니터링 강화"
    ]
  },
  "next_actions": [
    "서버별 상세 분석 실행",
    "프로세스 레벨 모니터링 활성화"
  ]
}
```

### 2. 실시간 스트리밍 API

#### 사고 과정 실시간 스트리밍
```bash
GET /api/ai-agent/thinking-process
Accept: text/event-stream

# SSE 스트림 응답
data: {"step": "tool_selection", "message": "CPU 분석을 위한 도구 선택 중..."}
data: {"step": "data_analysis", "message": "statistical_analysis 실행 중..."}
data: {"step": "pattern_detection", "message": "이상 패턴 탐지 중..."}
data: {"step": "result_synthesis", "message": "결과 통합 및 권장사항 생성 중..."}
data: {"step": "complete", "result": {...}}
```

### 3. 전문가 모드 API

#### 개별 도구 직접 호출
```bash
# 통계 분석만 실행
POST /api/ai/mcp/tools/statistical_analysis
{
  "data": [75, 80, 85, 90, 95],
  "analysis_type": "trend"
}

# 이상 탐지만 실행
POST /api/ai/mcp/tools/anomaly_detection
{
  "timeseries": [...],
  "threshold": 0.05,
  "model": "isolation_forest"
}
```

## 🛠️ 커스터마이징 가이드

### 1. 새로운 도구 추가

#### 도구 클래스 구현
```typescript
// src/core/mcp/tools/custom-tool.ts
export class CustomSecurityTool implements MCPTool {
  name = 'security_analysis';
  description = '보안 위협 분석 도구';
  
  keywords = ['보안', '위협', '공격', '취약점'];
  
  async execute(params: any, context: any): Promise<MCPToolResult> {
    // 1. 입력 데이터 검증
    if (!params.logs || !Array.isArray(params.logs)) {
      throw new Error('로그 데이터가 필요합니다');
    }
    
    // 2. 보안 분석 로직
    const threats = await this.detectThreats(params.logs);
    const vulnerabilities = await this.scanVulnerabilities(params.logs);
    
    // 3. 결과 반환
    return {
      tool_name: this.name,
      confidence: 0.87,
      result: {
        threats_detected: threats.length,
        high_risk_count: threats.filter(t => t.risk === 'high').length,
        vulnerabilities: vulnerabilities,
        recommendations: this.generateSecurityRecommendations(threats)
      },
      metadata: {
        analysis_time: Date.now(),
        scan_coverage: '100%'
      }
    };
  }
  
  private async detectThreats(logs: any[]): Promise<any[]> {
    // 보안 위협 탐지 로직
    return [];
  }
  
  private generateSecurityRecommendations(threats: any[]): string[] {
    // 보안 권장사항 생성
    return ['방화벽 규칙 검토', '접근 로그 모니터링 강화'];
  }
}
```

#### 오케스트레이터에 등록
```typescript
// src/core/mcp/mcp-orchestrator.ts
import { CustomSecurityTool } from './tools/custom-tool';

export class MCPOrchestrator {
  private tools: Map<string, MCPTool> = new Map();
  
  constructor() {
    // 기본 도구들 등록
    this.registerTool(new StatisticalAnalysisTool());
    this.registerTool(new AnomalyDetectionTool());
    // ... 기타 도구들
    
    // 커스텀 도구 등록
    this.registerTool(new CustomSecurityTool());
  }
}
```

### 2. 컨텍스트 규칙 커스터마이징

#### 비즈니스 규칙 추가
```typescript
// src/core/context/business-rules.ts
export class HighCPUAlertRule implements BusinessRule {
  name = 'high_cpu_critical_alert';
  
  condition = (context: SystemContext): boolean => {
    return context.cpu_usage > 90 && context.duration_minutes > 5;
  };
  
  apply = (context: SystemContext): RuleResult => {
    return {
      priority: 'critical',
      recommended_tools: ['anomaly_detection', 'root_cause_analysis'],
      alert_level: 'high',
      auto_actions: ['enable_detailed_monitoring', 'notify_oncall'],
      message: '5분 이상 지속되는 높은 CPU 사용률이 감지되었습니다.'
    };
  };
}
```

### 3. AI 엔진 설정 최적화

#### Python 엔진 설정
```python
# ai-engine-py/config.py
class AIEngineConfig:
    # 모델 설정
    ANOMALY_MODEL = 'IsolationForest'
    FORECAST_MODEL = 'Prophet'
    CLASSIFICATION_MODEL = 'RandomForest'
    
    # 성능 설정
    MAX_DATA_POINTS = 10000
    ANALYSIS_TIMEOUT = 30  # 초
    PARALLEL_JOBS = 4
    
    # 정확도 임계값
    MIN_CONFIDENCE = 0.7
    ANOMALY_THRESHOLD = 0.05
    PATTERN_SIMILARITY = 0.8
```

#### TypeScript 폴백 설정
```typescript
// src/services/ai/typescript-engine.ts
export const TypeScriptEngineConfig = {
  // 분석 설정
  maxDataPoints: 5000,
  timeoutMs: 10000,
  
  // 통계 설정
  confidenceLevel: 0.95,
  anomalyThreshold: 2.5, // 표준편차 배수
  
  // 패턴 인식 설정
  patternWindowSize: 100,
  similarityThreshold: 0.75
};
```

## 📊 성능 최적화

### 1. 캐시 최적화
```typescript
// 분석 결과 캐싱
interface AnalysisCacheConfig {
  ttl: 300000; // 5분
  maxSize: 100; // 최대 100개 결과
  keyPattern: 'analysis:{query_hash}:{timestamp}';
}

// 자주 사용되는 분석 결과 사전 계산
const PrecomputedAnalysis = {
  'daily_summary': '매일 00:00 자동 생성',
  'hourly_trends': '매시간 자동 업데이트',
  'anomaly_patterns': '실시간 업데이트'
};
```

### 2. 리소스 관리
```typescript
interface ResourceLimits {
  maxConcurrentAnalysis: 5;
  maxMemoryUsage: '512MB';
  maxExecutionTime: 30000; // 30초
  requestRateLimit: 60; // 분당 60회
}
```

## 🔍 모니터링 및 디버깅

### 1. AI 에이전트 메트릭
```typescript
interface AIAgentMetrics {
  totalQueries: number;
  successRate: number;
  averageResponseTime: number;
  toolUsageStats: Record<string, number>;
  errorRates: Record<string, number>;
  userSatisfactionScore: number;
}
```

### 2. 디버깅 도구
```bash
# AI 에이전트 상태 확인
curl http://localhost:3001/api/ai-agent/admin/status

# 실행 로그 조회
curl http://localhost:3001/api/ai-agent/admin/logs?limit=100

# 성능 메트릭 조회
curl http://localhost:3001/api/ai-agent/admin/metrics
```

### 3. 문제 해결

#### 일반적인 문제
1. **Python 엔진 연결 실패**
   - 환경 변수 `AI_ENGINE_URL` 확인
   - 네트워크 연결 상태 확인
   - TypeScript 폴백으로 자동 전환됨

2. **응답 시간 지연**
   - 데이터 크기 확인 (10,000개 이하 권장)
   - 캐시 히트률 확인
   - 병렬 처리 최적화

3. **정확도 저하**
   - 훈련 데이터 품질 확인
   - 모델 파라미터 튜닝
   - 컨텍스트 규칙 업데이트

## 📚 활용 사례

### 1. 일상적인 모니터링
- "오늘 시스템 상태 요약해주세요"
- "어제와 비교해서 성능 변화 알려주세요"
- "현재 가장 주의해야 할 서버는?"

### 2. 장애 대응
- "CPU 급증 원인 분석해주세요"
- "메모리 누수 가능성 확인해주세요"
- "네트워크 지연 원인 찾아주세요"

### 3. 용량 계획
- "다음 달 리소스 사용량 예측해주세요"
- "스케일링이 필요한 시점 알려주세요"
- "비용 최적화 방안 제안해주세요"

---

**이전 문서**: [3_INSTALLATION_AND_SETUP.md](./3_INSTALLATION_AND_SETUP.md) - 설치 및 설정  
**다음 문서**: [5_MONITORING_AND_DATA_FLOW.md](./5_MONITORING_AND_DATA_FLOW.md) - 모니터링 및 데이터 흐름 