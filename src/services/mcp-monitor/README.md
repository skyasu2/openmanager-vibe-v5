# MCP 서버 모니터링 시스템

OpenManager VIBE v5의 10개 MCP 서버를 실시간으로 모니터링하는 시스템입니다.

## 🚀 주요 기능

- **실시간 헬스체크**: 15초 간격으로 서버 상태 확인
- **Circuit Breaker 패턴**: 장애 격리 및 자동 복구
- **성능 메트릭**: 응답시간, 성공률, 에러율 추적
- **자동 복구**: Critical 서버 자동 재시작
- **REST API**: 웹 대시보드 통합

## 📊 모니터링 대상 서버

### Critical (3개)
- `filesystem`: 파일 시스템 작업
- `memory`: 지식 그래프 관리
- `supabase`: 데이터베이스 작업

### High (2개)
- `github`: GitHub 저장소 관리
- `serena`: 고급 코드 분석

### Medium (4개)
- `tavily-mcp`: 웹 검색
- `sequential-thinking`: 복잡한 문제 해결
- `playwright`: 브라우저 자동화
- `context7`: 라이브러리 문서 검색

### Low (1개)
- `time`: 시간/시간대 변환

## 🛠️ 사용 방법

### 1. 스크립트 사용

```bash
# 종합 헬스체크 실행
bash scripts/mcp/health-check.sh

# 모니터링 환경 설정
bash scripts/mcp/monitor-setup.sh

# 실패한 서버 복구
bash scripts/mcp/monitor-setup.sh repair

# 모든 서버 재시작
bash scripts/mcp/monitor-setup.sh restart

# 현재 상태 확인
bash scripts/mcp/monitor-setup.sh status
```

### 2. TypeScript API 사용

```typescript
import { MCPMonitoringSystem } from '@/services/mcp-monitor';

// 모니터링 시스템 초기화
const monitoring = new MCPMonitoringSystem();
await monitoring.initialize();

// 시스템 상태 조회
const status = monitoring.getSystemStatus();
console.log(status);

// 최신 메트릭 조회
const metrics = monitoring.getLatestMetrics();
console.log(metrics);

// 서버 재시작
await monitoring.restartServer('serena');
```

### 3. REST API 사용

```bash
# 전체 시스템 헬스체크
curl http://localhost:3000/api/mcp-monitor/health

# 개별 서버 헬스체크
curl http://localhost:3000/api/mcp-monitor/health?server=filesystem

# 메트릭 조회
curl http://localhost:3000/api/mcp-monitor/metrics

# 시스템 상태 조회
curl http://localhost:3000/api/mcp-monitor/status?detailed=true

# 서버 재시작
curl -X POST http://localhost:3000/api/mcp-monitor/metrics \
  -H "Content-Type: application/json" \
  -d '{"serverId": "serena", "action": "restart"}'
```

## 📈 메트릭 및 임계값

### 성능 임계값
- **응답시간**: 서버별로 100ms~800ms
- **에러율**: 2%~10% (서버별)
- **Circuit Breaker**: 5회 연속 실패 시 차단

### 수집 메트릭
- 응답시간 (Response Time)
- 성공률 (Success Rate)
- 에러율 (Error Rate)
- 요청 수 (Request Count)
- Circuit Breaker 상태
- 서버 가동시간 (Uptime)

## 🔧 설정

### 환경변수 (.env.local)
```bash
# GitHub
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx

# Supabase  
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_ANON_KEY=eyJhbGci...

# Tavily
TAVILY_API_KEY=tvly-xxxxx

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AbYGAAIj...
```

### 모니터링 설정 (config.ts)
```typescript
export const MONITORING_CONFIG = {
  global: {
    healthCheckInterval: 15000, // 15초
    metricsCollectionInterval: 30000, // 30초
    performanceBudget: 150, // 150ms 목표
  },
  alerting: {
    enabled: true,
    channels: ['console', 'redis'],
    thresholds: {
      serverDown: 3, // 3회 연속 실패 시 알림
      highLatency: 500, // 500ms 초과 시 알림
      errorRate: 10, // 10% 초과 시 알림
    },
  },
};
```

## 🚨 알림 및 자동 복구

### 알림 규칙
- **Critical**: 중요 서버 다운 시 즉시 알림
- **Warning**: 성능 저하 또는 일반 서버 문제
- **Info**: 서버 복구 또는 상태 변경

### 자동 복구
- Critical 서버 (filesystem, memory, supabase)는 3회 연속 실패 시 자동 재시작
- Circuit Breaker를 통한 장애 격리
- 복구 시도 후 1분간 쿨다운

## 📊 대시보드 통합

모니터링 데이터는 OpenManager VIBE v5의 관리자 대시보드에서 실시간으로 확인 가능:

- **실시간 서버 상태**: 색상 코드로 상태 표시
- **성능 차트**: 응답시간, 성공률 트렌드
- **Circuit Breaker 상태**: 서버별 차단 상태
- **자동 복구 로그**: 복구 시도 이력

## 🔍 문제 해결

### 일반적인 문제
1. **서버 연결 실패**
   ```bash
   # 서버 재시작
   bash scripts/mcp/monitor-setup.sh restart
   ```

2. **환경변수 누락**
   ```bash
   # .env.local 파일 확인
   cp env.local.template .env.local
   # 필요한 토큰 설정 후 재시작
   ```

3. **높은 지연시간**
   ```bash
   # 헬스체크로 원인 파악
   bash scripts/mcp/health-check.sh
   ```

### 로그 확인
```bash
# 헬스체크 로그
tail -f reports/mcp-health-*.md

# 모니터링 설정 로그  
tail -f reports/mcp-monitor-setup-*.log

# 실시간 메트릭 (콘솔)
node -e "
const { getGlobalMonitoringSystem } = require('./dist/services/mcp-monitor');
const monitor = getGlobalMonitoringSystem();
monitor.on('metrics', console.log);
monitor.initialize();
"
```

## 🔄 업그레이드 및 유지보수

### 정기 유지보수
- 주간: 헬스체크 로그 검토
- 월간: 성능 트렌드 분석
- 분기: 임계값 조정 검토

### 버전 업그레이드
```bash
# MCP 서버 패키지 업데이트
npm update @modelcontextprotocol/server-*
npm update @supabase/mcp-server-supabase
npm update tavily-mcp

# 설정 다시 적용
bash scripts/mcp/monitor-setup.sh setup
```

## 📚 참고 자료

- [Claude Code MCP 공식 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [MCP 서버 완전 가이드](/docs/mcp-servers-complete-guide.md)
- [OpenManager VIBE v5 시스템 아키텍처](/docs/system-architecture.md)