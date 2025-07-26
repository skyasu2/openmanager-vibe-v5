# 🔧 MCP 서버 및 서브 에이전트 개선 계획

**작성일**: 2025-07-26  
**작성자**: Claude Code AI  
**버전**: 1.0

## 📊 현황 분석 요약

### MCP 서버 상태

- **설치 위치**: `~/.npm/_npx/` 캐시 디렉토리
- **실행 방식**: npx를 통한 동적 실행 (Node.js v22.15.1)
- **활성 서버**: 8개 중 7개 정상 작동
- **문제 서버**: GitHub (토큰 인증 실패)

### 서브 에이전트 테스트 결과

- ✅ **mcp-server-admin**: 정상 작동, 상세한 상태 점검 제공
- ✅ **issue-summary**: 정상 작동, 시스템 전체 이슈 파악
- ✅ **ai-systems-engineer**: 정상 작동, AI 시스템 최적화 방안 제시
- ✅ **code-review-specialist**: 정상 작동, 상세한 코드 리뷰 제공

## 🚨 즉시 조치 필요 사항

### 1. GitHub Personal Access Token 재생성

```bash
# 1. GitHub에서 새 토큰 생성
# Settings > Developer settings > Personal access tokens > Generate new token

# 2. 필요 권한:
# - repo (전체 저장소 접근)
# - workflow (GitHub Actions)
# - read:org (조직 정보 읽기)

# 3. 환경변수 설정
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_새로운토큰"

# 4. .env.local에 추가
echo "GITHUB_PERSONAL_ACCESS_TOKEN=ghp_새로운토큰" >> .env.local
```

### 2. Supabase MCP 서버 환경변수 수정

```bash
# .mcp.json 수정 필요
# SUPABASE_ACCESS_TOKEN을 SUPABASE_SERVICE_ROLE_KEY로 통일
```

### 3. GCP VM 리소스 최적화

- 현재 100% 사용 중인 e2-micro 인스턴스 최적화
- 불필요한 프로세스 종료 또는 스케줄링

## 💡 개선 제안사항

### 1. MCP 서버 선택적 활성화

현재 모든 MCP 서버가 동시에 실행되어 리소스를 과도하게 사용합니다.

**개선안**: 작업별 MCP 서버 그룹 정의

```json
{
  "mcpProfiles": {
    "development": ["filesystem", "memory", "github"],
    "ai-tasks": ["memory", "sequential-thinking", "context7", "tavily-mcp"],
    "database": ["supabase", "memory"],
    "testing": ["playwright", "filesystem"]
  }
}
```

### 2. 서브 에이전트 활용 가이드라인

각 작업 유형별 권장 서브 에이전트 매핑:

| 작업 유형    | 권장 서브 에이전트                                                            | 사용 시점                                 |
| ------------ | ----------------------------------------------------------------------------- | ----------------------------------------- |
| 새 기능 개발 | gemini-cli-collaborator → code-review-specialist → test-automation-specialist | 아키텍처 검토 → 구현 → 테스트             |
| 버그 수정    | test-automation-specialist → code-review-specialist                           | 원인 분석 → 수정 후 검증                  |
| 성능 최적화  | issue-summary → database-administrator → ux-performance-optimizer             | 현황 파악 → DB 최적화 → 프론트엔드 최적화 |
| 시스템 점검  | issue-summary → mcp-server-admin                                              | 전체 상태 → 상세 진단                     |

### 3. MCP 서버 모니터링 도구 개발

```typescript
// src/utils/mcp-monitor.ts
export class MCPMonitor {
  async getServerStatus(): Promise<MCPServerStatus[]> {
    // 각 MCP 서버의 상태 확인
    // 메모리 사용량, 응답 시간 측정
    // 헬스체크 엔드포인트 호출
  }

  async restartServer(serverName: string): Promise<void> {
    // 특정 MCP 서버 재시작
  }

  async optimizeResources(): Promise<void> {
    // 사용하지 않는 서버 자동 종료
    // 리소스 재할당
  }
}
```

### 4. 서브 에이전트 성능 메트릭 수집

```typescript
interface SubAgentMetrics {
  agentType: string;
  taskDescription: string;
  executionTime: number;
  tokenUsage: number;
  successRate: number;
  userSatisfaction?: number;
}

// 각 서브 에이전트 호출 시 메트릭 수집
// 주기적으로 분석하여 최적의 에이전트 추천
```

### 5. 자동화된 환경 설정 검증

```bash
#!/bin/bash
# scripts/validate-mcp-env.sh

echo "🔍 MCP 환경 검증 시작..."

# 필수 환경변수 체크
required_vars=(
  "GITHUB_PERSONAL_ACCESS_TOKEN"
  "TAVILY_API_KEY"
  "SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ $var가 설정되지 않았습니다"
  else
    echo "✅ $var 설정됨"
  fi
done

# MCP 서버 연결 테스트
npm run mcp:health-check
```

## 📈 예상 효과

1. **리소스 사용량 감소**: 30-50% 메모리 절약
2. **응답 속도 향상**: 필요한 서버만 활성화로 20% 개선
3. **개발 생산성**: 서브 에이전트 활용으로 40% 향상
4. **시스템 안정성**: 자동 모니터링으로 장애 사전 방지

## 🗓️ 구현 로드맵

### Phase 1 (1주)

- [ ] GitHub 토큰 재생성 및 설정
- [ ] Supabase 환경변수 통일
- [ ] MCP 프로필 시스템 구현

### Phase 2 (2주)

- [ ] MCP 모니터링 도구 개발
- [ ] 서브 에이전트 메트릭 수집 시스템
- [ ] 자동화 스크립트 작성

### Phase 3 (3주)

- [ ] 성능 최적화 및 튜닝
- [ ] 문서 업데이트
- [ ] 팀 교육 및 가이드 배포

## 🎯 성공 지표

- MCP 서버 가용성: 99.9% 이상
- 평균 응답 시간: 500ms 이하
- 서브 에이전트 활용률: 80% 이상
- 개발자 만족도: 4.5/5.0 이상

---

이 개선 계획을 통해 MCP 서버와 서브 에이전트 시스템을 더욱 효율적이고 안정적으로 운영할 수 있을 것입니다.
