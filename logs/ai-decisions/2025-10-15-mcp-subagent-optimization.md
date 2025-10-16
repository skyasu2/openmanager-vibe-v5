# MCP 사용 및 서브에이전트 최적화 - AI 교차검증

**날짜**: 2025-10-15
**상황**: OpenManager VIBE v5.80.0 MCP 사용과 서브에이전트 활용 패턴 분석 후 개선 방안 마련

---

## 🤖 AI 의견 요약

### ⚠️ 실행 상황
- **Codex**: ❌ 타임아웃 (300초 초과) - 질문이 너무 복잡, 분할 필요
- **Gemini**: ✅ 성공 (60초) - 상세한 아키텍처 분석 제공
- **Qwen**: ⏳ 실행 중 (600초 타임아웃까지 대기 중, 미완료)

**부분 성공 모드**: Gemini 결과 기반 Decision Log 작성

---

### 📐 Gemini (아키텍처 관점) - 60초 ⭐⭐⭐⭐⭐

**핵심 주장**: "정적이고 분산된 AI 활용 정책이 근본 문제. 중앙화되고 자동화된 아키텍처로 전환 필요."

**근거**:
1. **SRP/OCP 위반**: 개발자가 각 MCP와 서브에이전트를 수동 선택 → 인지 부하 유발
2. **관측 가능성 부재**: 토큰 로깅 시스템 없음 → 최적화 불가능
3. **효율 격차**: Context7 20%, Vercel MCP 20% → 자동 라우팅 부재

**추천 사항** (우선순위 4단계):

#### P0 (최우선): AI Gateway를 통한 토큰 사용량 로깅 시스템 구축
- **ROI**: **무한대** (모든 최적화의 전제조건)
- **필수 로깅**: `(timestamp, agent, mcp, prompt_tokens, completion_tokens, total_tokens, duration, cache_hit)`
- **구현**: 단일 게이트웨이를 통한 모든 AI API 호출 통제
- **관점**: 시스템 관측 가능성(Observability) 확보

#### P1 (높음): `UnifiedAIEngineRouter` 구현 및 적용
- **ROI**: **매우 높음** (MCP 준수율 71.1% → 90%+ 목표)
- **기능**: AI 요청 목적 분석 → 최적 MCP 자동 선택
- **인터페이스**: `UnifiedAIEngineRouter.process("쿼리", { type: "..." })`
- **효과**:
  - 개발자는 MCP 직접 호출 불필요
  - MCP 추가/변경 시 라우터만 수정 (OCP)
  - 중앙 집중형 제어 구조 확립

#### P2 (중간): 시맨틱 캐시(Semantic Cache) 구현
- **ROI**: **높음** (토큰 비용 직접 절감, 82% 목표 달성 핵심)
- **기술**: Supabase RAG 기반 벡터 검색
- **프로세스**:
  1. AI 요청 전 유사한 과거 요청 벡터 검색
  2. 캐시 적중 시 API 호출 없이 저장된 결과 반환
  3. 토큰 사용 원천 차단
- **추가**: 동적 컨텍스트 압축 (불필요한 컨텍스트 사전 제거)

#### P3 (장기): 서브에이전트 리팩토링 (역할 기반 재분류)
- **ROI**: **중간** (장기 유지보수성 및 확장성)
- **변경**:
  - 'Tier' → '기능 도메인' (`CodeAnalysis`, `Security`, `Performance`, `Documentation`)
  - **Agent Orchestrator** 도입: 특정 작업에 필요한 서브에이전트 조합 동적 구성
  - 예: `git diff` 리뷰 → `CodeAnalysis` + `Security` 자동 실행
- **효과**: 각 에이전트 명확한 책임(ISP), 유연한 조합

---

## ⚖️ 합의점과 충돌점

### ✅ 합의 (Gemini 단독)
1. **토큰 로깅 최우선**: 측정 없이는 최적화 불가능 (P0)
2. **자동화 필요**: 수동 선택 → 자동 라우팅 전환 (P1)
3. **구조 개선 필요**: SOLID 원칙 적용한 아키텍처 리팩토링

### ⚠️ 충돌 (부재)
- Codex, Qwen 실행 실패/미완료로 충돌점 없음
- Gemini 단독 제안

---

## 🎯 Claude Code 최종 판단

### 채택된 방안: "단계별 실용적 개선 (4 Phases)"

**Phase 1 (즉시, 1일)**: 토큰 로깅 시스템 구축 ⭐ **Gemini P0 채택**
- ✅ Codex Wrapper 토큰 추출 로직 수정
- ✅ Claude Code 세션 토큰 추적 스크립트 작성 (`npx ccusage@latest`)
- ✅ 구조화된 로그 저장 (`logs/analysis/token-usage-YYYY-MM-DD.log`)
- ✅ 주간 토큰 효율성 리포트 자동화

**Phase 2 (1주)**: MCP 우선순위 자동 체크 ⭐ **부분 채택**
- ✅ Pre-commit Hook에 MCP 우선순위 체크 추가
- ✅ Vercel CLI/WebSearch 사용 시 경고 표시
- ⏳ `UnifiedAIEngineRouter` 설계 시작 (Gemini P1 장기 계획)

**Phase 3 (1개월)**: Context7, Vercel MCP 활용도 증대
- ✅ 서브에이전트 정의 업데이트 (5개 이상 참조 목표)
- ✅ 활용 통계 자동 추적 (`subagent-stats.sh`)
- ⏳ 시맨틱 캐시 설계 시작 (Gemini P2 장기 계획)

**Phase 4 (3개월)**: 아키텍처 리팩토링 ⚠️ **조건부 보류**
- ⏳ `UnifiedAIEngineRouter` 구현 (Phase 2 설계 완료 후)
- ⏳ 시맨틱 캐시 구현 (Phase 3 설계 완료 후)
- ⏳ 서브에이전트 역할 기반 재분류 (Gemini P3)

---

### 선택 근거

**1. Gemini P0 (토큰 로깅) 즉시 채택**
- **이유**: **"측정 없이는 최적화 불가능"** (Gemini 강조)
- **ROI**: 무한대 (모든 개선의 전제조건)
- **실현 가능성**: 높음 (Wrapper 수정 + ccusage 스크립트)
- **Claude 평가**: **즉시 실행 필수** ⭐

**2. Gemini P1 (UnifiedAIEngineRouter) 설계 시작, 구현 보류**
- **이유**:
  - ROI 높음 (MCP 준수율 71.1% → 90%+ 달성)
  - **단, 설계 복잡도 높음** (중앙 라우팅 로직, 모든 MCP 통합)
  - **1인 개발 환경**에서 초기 비용 부담 (3-5주 예상)
- **전환 시점**: Phase 1 토큰 로그 분석 → 실제 ROI 검증 후
- **Claude 평가**: **장기 계획 (3개월), 설계만 1주 내 시작** ⚠️

**3. Gemini P2 (시맨틱 캐시) 설계 시작, 구현 보류**
- **이유**:
  - ROI 높음 (토큰 82% 절약 목표 달성 핵심)
  - **기술 복잡도 높음** (Supabase RAG, 벡터 검색, 캐시 관리)
  - **1인 개발 환경**에서 초기 비용 부담 (4-6주 예상)
- **전환 시점**: Phase 1/2 완료 → 실제 캐시 적중률 예측 후
- **Claude 평가**: **장기 계획 (3개월), 설계만 1개월 내 시작** ⚠️

**4. Gemini P3 (서브에이전트 리팩토링) 보류**
- **이유**:
  - 현재 12개 최적화 완료 (22개 → 12개)
  - Tier 3 활용도 낮지만 **근본 원인 미파악** (토큰 로그 필요)
  - 역할 기반 재분류는 **Phase 1 데이터 분석 후 판단**
- **Claude 평가**: **데이터 기반 의사결정 (3개월 후 재검토)** ⏳

---

### 기각된 의견

- ❌ **Gemini P1/P2 즉시 구현**: 1인 개발 환경에서 초기 비용 과다
  - `UnifiedAIEngineRouter`: 3-5주 예상 (중앙 라우팅 로직 복잡)
  - 시맨틱 캐시: 4-6주 예상 (Supabase RAG 구축 복잡)
  - **현재는 과도한 엔지니어링 (Over-Engineering)** ⚠️

- ❌ **Gemini P3 즉시 실행**: 토큰 로그 데이터 없이 재분류 불가
  - Tier 3 활용도 낮은 근본 원인 미파악
  - **데이터 기반 의사결정 필요** (Phase 1 완료 후)

---

## 💡 최종 결론

### 핵심 질문: 현재 MCP 사용과 서브에이전트 활용이 최적인가?

**답변**: ⚠️ **부분적으로 최적이나, 토큰 로깅 부재가 치명적 결함**

**현황 평가**:

| 항목 | 현재 | 목표 | Claude 판단 |
|------|------|------|-------------|
| **MCP 연결** | 9/9 (100%) | 9/9 | ✅ 완벽 |
| **MCP 준수도** | 71.1% | 90%+ | ⚠️ Context7/Vercel 낮음 |
| **서브에이전트** | 12개 (45% 최적화) | 12개 | ✅ 최적화 완료 |
| **AI 교차검증** | 1.4개/일 (9.17/10) | 1.5개/일 | ✅ 활발 |
| **토큰 로깅** | ❌ 없음 | ✅ 자동 추적 | ❌ **치명적 결함** |
| **토큰 절약** | 추정 50% | 82% | ⚠️ 측정 불가 |

**합의 요청 답변** (Gemini 단독 기반):

1. **MCP 우선순위 준수 방안?** → ✅ **Phase 2 Pre-commit Hook (1주 내 적용)**
   - 즉시: Vercel CLI/WebSearch 경고 표시
   - 장기: UnifiedAIEngineRouter 설계 시작 (3개월 목표)

2. **서브에이전트 12개의 최적성?** → ✅ **현재 최적, 단 데이터 기반 재검토 필요**
   - 현재: 12개 최적화 완료 (22개 → 12개)
   - 미래: Phase 1 토큰 로그 → Tier 3 근본 원인 파악 → 역할 기반 재분류 검토

3. **Token 절약 목표(82%) 달성 전략?** → ⭐ **Phase 1 토큰 로깅이 핵심**
   - **즉시 (Phase 1)**: 토큰 로깅 시스템 구축 (Gemini P0)
   - **중기 (Phase 3)**: Context7/Vercel MCP 활용도 증대 (추정 70% → 실제 측정)
   - **장기 (Phase 4)**: 시맨틱 캐시 구현 (Gemini P2, 82% 달성 핵심)

4. **개선 방안 우선순위?** → ✅ **Phase 1 > 2 > 3 > 4 (ROI 중심)**
   - Phase 1 (즉시): 토큰 로깅 → 데이터 기반 의사결정 가능
   - Phase 2 (1주): MCP 우선순위 자동 체크 → 준수도 향상
   - Phase 3 (1개월): Context7/Vercel 활용도 증대 → 절약률 향상
   - Phase 4 (3개월): 아키텍처 리팩토링 → 장기 효율성

---

## 📝 실행 내역

### 즉시 실행 (Phase 1: 토큰 로깅, 1일 내)

- [ ] **Codex Wrapper 토큰 추출 수정**: `scripts/ai-subagents/codex-wrapper.sh`
  ```bash
  # 토큰 추출 로직 강화
  local tokens_used=$(grep "tokens used:" "$output_file" | tail -1 | sed 's/.*tokens used: //' | tr -d ',')
  if [ -n "$tokens_used" ]; then
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] TOKENS: $tokens_used" >> "$LOG_FILE"
  fi
  ```

- [ ] **Claude Code 세션 토큰 추적 스크립트**: `scripts/weekly-token-report.sh`
  ```bash
  #!/bin/bash
  npx ccusage@latest > logs/analysis/claude-token-$(date +%F).log
  echo "✅ Claude Code 세션 토큰 저장 완료"
  ```

- [ ] **주간 토큰 효율성 리포트 자동화**: Cron Job 설정
  ```bash
  # 매주 월요일 오전 9시 실행
  0 9 * * 1 /mnt/d/cursor/openmanager-vibe-v5/scripts/weekly-token-report.sh
  ```

- [ ] **구조화된 로그 저장 형식 정의**: `logs/analysis/token-usage-YYYY-MM-DD.log`
  ```yaml
  timestamp: YYYY-MM-DD HH:MM:SS
  agent: codex | gemini | qwen | claude
  mcp: serena | vercel | context7 | supabase | ...
  prompt_tokens: NUMBER
  completion_tokens: NUMBER
  total_tokens: NUMBER
  duration: SECONDS
  cache_hit: true | false
  ```

---

### 1주 내 실행 (Phase 2: MCP 우선순위 자동 체크)

- [ ] **Pre-commit Hook 작성**: `.git/hooks/pre-commit`
  ```bash
  #!/bin/bash

  # Vercel CLI 사용 감지
  if git diff --cached | grep -q "vercel ls\|vercel env"; then
    echo "⚠️  Warning: Vercel CLI 사용 감지 (MCP 권장: 89배 빠름)"
    echo "   mcp__vercel__list_projects(teamId) 사용 권장"
  fi

  # WebSearch 사용 감지
  if git diff --cached | grep -q "WebSearch.*Next.js\|WebSearch.*React"; then
    echo "⚠️  Warning: WebSearch 사용 감지 (Context7 권장: 100% 정확)"
    echo "   mcp__context7__get_library_docs() 사용 권장"
  fi
  ```

- [ ] **UnifiedAIEngineRouter 설계 문서 작성**: `docs/claude/architecture/unified-ai-engine-router.md`
  - 요구사항 정의
  - 인터페이스 설계
  - MCP 라우팅 규칙
  - 구현 로드맵 (3개월)

---

### 1개월 내 실행 (Phase 3: MCP 활용도 증대)

- [ ] **서브에이전트 정의 업데이트**: Context7, Vercel MCP 참조 추가
  - code-review-specialist: Context7 추가 (에러 메시지 문서 조회)
  - debugger-specialist: Context7 추가 (공식 문서 참조)
  - vercel-platform-specialist: Vercel MCP 5개 이상 도구 추가

- [ ] **활용 통계 자동 추적 스크립트**: `scripts/subagent-stats.sh`
  ```bash
  #!/bin/bash
  echo "📊 서브에이전트 활용 통계 (최근 30일)"
  for agent in $(ls .claude/agents/*.md); do
    name=$(basename $agent .md)
    count=$(grep -l "$name" logs/ai-decisions/*.md 2>/dev/null | wc -l)
    echo "$name: $count회"
  done | sort -t':' -k2 -rn
  ```

- [ ] **시맨틱 캐시 설계 문서 작성**: `docs/claude/architecture/semantic-cache.md`
  - Supabase RAG 아키텍처
  - 벡터 검색 알고리즘
  - 캐시 적중률 예측
  - 구현 로드맵 (3개월)

---

### 3개월 내 실행 (Phase 4: 아키텍처 리팩토링, 조건부)

- [ ] **UnifiedAIEngineRouter 구현** (Phase 2 설계 완료 후)
  - MCP 자동 라우팅 로직
  - 개발자 인터페이스 추상화
  - 테스트 및 배포

- [ ] **시맨틱 캐시 구현** (Phase 3 설계 완료 후)
  - Supabase pgvector 테이블 생성
  - 벡터 검색 API 구현
  - 캐시 관리 로직
  - 성능 측정 (캐시 적중률)

- [ ] **서브에이전트 역할 기반 재분류** (Phase 1 데이터 분석 후)
  - Tier → 기능 도메인 재분류
  - Agent Orchestrator 설계
  - 동적 에이전트 조합 로직

---

## 📊 AI 실행 통계

| AI | 응답 시간 | Exit Code | 핵심 제안 수 | 품질 |
|----|----------|-----------|-------------|------|
| **Codex** | - (타임아웃) | 1 (실패) | 0개 | ❌ 질문 복잡도 과다 |
| **Gemini** | 60초 | 0 (성공) | 4개 (P0-P3) | ⭐⭐⭐⭐⭐ 아키텍처 분석 우수 |
| **Qwen** | - (미완료) | - (실행 중) | 0개 | ⏳ 600초 타임아웃 대기 중 |

**실행 상황**:
- **부분 성공**: 1/3 AI (Gemini만 성공)
- **총 소요 시간**: 60초 (병렬 실행 실패)
- **실패 원인**: 질문 복잡도 과다 (5,000+ 토큰 추정)

**개선 방안**:
- AI 교차검증 질문 분할 (3개 → 각 1,500 토큰 이하)
- Codex/Qwen 타임아웃 증가 (300초 → 600초)
- 또는 간소화된 요약 제공 (현재 분석 결과 요약 → 500 토큰)

---

## 🔗 관련 문서

**분석 리포트**:
- `logs/analysis/mcp-usage-pattern-2025-10-15.md` - MCP 우선순위 준수도 분석
- `logs/analysis/subagent-utilization-2025-10-15.md` - 서브에이전트 활용도 분석
- `logs/analysis/token-efficiency-2025-10-15.md` - 토큰 효율성 측정

**프로젝트 문서**:
- `CLAUDE.md` - 프로젝트 메모리
- `docs/claude/environment/mcp/mcp-priority-guide.md` - MCP 우선순위 가이드
- `.claude/agents/mcp-mapping.json` - 서브에이전트 매핑 v4.0.0

**Wrapper 스크립트**:
- `scripts/ai-subagents/codex-wrapper.sh` - Codex CLI Wrapper
- `scripts/ai-subagents/gemini-wrapper.sh` - Gemini CLI Wrapper
- `scripts/ai-subagents/qwen-wrapper.sh` - Qwen CLI Wrapper

---

**💡 핵심** (Gemini 단독 제안):
- **즉시 (Phase 1)**: 토큰 로깅 시스템 구축 (ROI 무한대)
- **1주 (Phase 2)**: MCP 우선순위 자동 체크 (Pre-commit Hook)
- **1개월 (Phase 3)**: Context7/Vercel MCP 활용도 증대
- **3개월 (Phase 4)**: 아키텍처 리팩토링 (조건부, 데이터 기반)

**🚀 다음 단계**: Phase 1 토큰 로깅 시스템 즉시 구축 → 데이터 기반 의사결정 가능

**⚠️ 주의**: Codex/Qwen 타임아웃 발생 → AI 교차검증 질문 분할 필요
