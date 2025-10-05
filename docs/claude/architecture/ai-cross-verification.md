# AI 교차검증 시스템

## 개요
3-AI 협업 교차검증 시스템 - Claude, Codex, Gemini, Qwen

## 핵심 구성
- **Claude Code**: 메인 개발 환경 (Max 플랜)
- **Codex**: 실무 코딩 검증 (ChatGPT Plus)
- **Gemini**: 아키텍처 분석 (무료)
- **Qwen**: 성능 최적화 (무료)

## AI 호출 방법 비교

### 방법 A: Multi-AI MCP (✅ **최우선 권장**)
**2025-10-05 업데이트**: Multi-AI MCP 도구를 최우선으로 사용

**장점**:
- ✅ **구조화된 결과**: JSON 형태로 즉시 분석 가능
- ✅ **자동 합의 분석**: synthesis.consensus 자동 생성
- ✅ **충돌 감지**: conflicts 자동 식별
- ✅ **성능 추적**: 응답 시간, 성공률 자동 기록
- ✅ **100% 성공률**: 21초 만에 3-AI 병렬 실행 (2025-10-05 검증)

**사용 예시**:
```typescript
// 전체 AI 교차검증
mcp__multi_ai__queryAllAIs({
  query: "검증 내용",
  qwenPlanMode: false  // Normal Mode 권장 (8초 응답)
})

// 선택적 AI 실행
mcp__multi_ai__queryWithPriority({
  query: "검증 내용",
  includeCodex: true,
  includeGemini: true,
  includeQwen: true
})
```

**최신 검증 결과** (2025-10-05):
- Qwen wrapper v1.1.0 검증: **평균 8.67/10**
- Codex 8/10, Gemini 10/10, Qwen 8/10
- 총 실행 시간: 21.7초 (3-AI 병렬)

### 방법 B: Bash CLI 병렬 실행 (⚠️ **MCP 불가 시 대안**)
**사용 시나리오**: MCP 서버 연결 실패 시, 디버깅 목적

- 호출: Claude가 bash로 3개 AI CLI 병렬 실행
- 실행: `codex exec & gemini & qwen -p & wait`
- 단점: 수동 합의 분석 필요, Claude가 결과 종합해야 함
- 용도: MCP 사용 불가 시 백업 방법

### 방법 C: Task Tool (**❌ 사용 금지** - Claude 역할극)
⚠️ **주의**: Task tool 서브에이전트는 **실제 외부 AI를 호출하지 않고** Claude가 특정 관점으로 역할극하는 것입니다.
- 호출: `Task codex-specialist "코드 검증"`
- 실행: Claude가 codex-specialist **역할**로 분석 (실제 Codex AI 아님)
- 문제점: 진정한 교차검증 불가능, Claude의 단일 관점만 제공
- **권장하지 않음**: 교차검증 목적으로는 절대 사용하지 마세요

### 비교표

| 항목 | 방법 A (Multi-AI MCP) | 방법 B (Bash 병렬) | 방법 C (Task Tool) |
|------|-----------------------|-------------------|-------------------|
| **실행 방식** | ✅ MCP 도구로 3-AI 병렬 | ✅ Bash CLI 병렬 실행 | ❌ Claude 역할극 |
| **결과 형식** | ✅ 구조화된 JSON | ⚠️ 텍스트 파일 | ❌ 비구조화 |
| **합의 분석** | ✅ 자동 생성 | ❌ 수동 분석 필요 | ❌ 불가능 |
| **성능 추적** | ✅ 자동 기록 | ❌ 수동 측정 | ❌ 없음 |
| **정확성** | ✅ 3개 AI 독립 판단 | ✅ 3개 AI 독립 판단 | ❌ Claude 단일 관점 |
| **속도** | ~22초 (병렬 실행) | ~15초 (병렬 실행) | 빠름 (내부 처리) |
| **사용 여부** | ✅ **최우선 권장** | ⚠️ MCP 불가 시만 | ❌ 절대 금지 |

---

## 사용 방법

### 방법 A: Multi-AI MCP (✅ 최우선 권장)
```typescript
// 1. 전체 AI 교차검증 (Claude Code 내에서)
"이 코드를 Multi-AI MCP로 교차검증해줘"

// 2. 명시적 MCP 도구 호출
mcp__multi_ai__queryAllAIs({
  query: "Qwen wrapper v1.1.0 개선사항 검증",
  qwenPlanMode: false  // Normal Mode (8초 응답)
})

// 3. 선택적 AI 실행 (특정 AI만)
mcp__multi_ai__queryWithPriority({
  query: "성능 최적화 방법",
  includeCodex: true,   // 실무 관점
  includeGemini: false, // 아키텍처 제외
  includeQwen: true     // 성능 전문가만
})
```

**자동 제공 결과**:
- ✅ 각 AI의 점수 및 평가
- ✅ 합의 항목 자동 추출 (synthesis.consensus)
- ✅ 충돌 항목 자동 식별 (synthesis.conflicts)
- ✅ 성능 지표 (총 실행 시간, 성공률)

### 방법 B: Bash CLI 병렬 실행 (⚠️ MCP 불가 시만)
```bash
# MCP 서버 연결 실패 시 대안
"이 코드를 3개 AI로 교차검증해줘 (Bash CLI 사용)"

# → Claude가 bash로 실제 외부 AI CLI 병렬 실행:
#   - codex exec "코드 검증" > /tmp/codex.txt &
#   - gemini "아키텍처 분석" > /tmp/gemini.txt &
#   - qwen -p "성능 분석" > /tmp/qwen.txt &
#   - wait
# → Claude가 /tmp 파일 읽고 수동 합의 분석
```

### 터미널에서 직접 AI CLI 호출 (개별 AI만 필요 시)
```bash
# Codex Wrapper (적응형 타임아웃)
./scripts/ai-subagents/codex-wrapper.sh "버그 분석"

# Gemini CLI (30초 고정)
gemini "아키텍처 설계 검토"

# Qwen Wrapper v1.1.0 (Plan Mode 90초, Normal 45초)
./scripts/ai-subagents/qwen-wrapper.sh -p "성능 최적화 계획"
./scripts/ai-subagents/qwen-wrapper.sh "빠른 분석"  # Normal Mode
```

**⚠️ 주의**: 개별 AI 호출은 교차검증이 아니므로 단일 관점만 제공합니다. Multi-AI MCP 사용을 권장합니다.

### 히스토리 기반 검증 (2025-10-02 추가)
```bash
# 이전 검증 결과와 비교
"지난번 AI 검증과 비교해서 이번 변경사항 검증해줘"

# 개선 추세 확인
"최근 AI 검증 히스토리를 분석해서 개선 추세 보여줘"

# 반복 문제 식별
"AI 검증 히스토리에서 반복되는 문제 패턴 찾아줘"
```

## 히스토리 자동 저장 (2025-10-02 개선)

**위치**: `reports/quality/ai-verifications/`

**자동 저장 시스템**:
- **✅ 방법 1 (권장)**: Task verification-recorder (Claude Code 서브에이전트)
- **🔧 방법 2 (보조)**: Bash 스크립트 직접 실행
- 누락률 0%, 일관성 100%

**저장 내용**:
- 검증 일시 및 대상
- 3-AI 점수 (codex, gemini, qwen)
- Claude 최종 판단
- 적용된 개선 조치
- 개선 전후 비교

**파일 형식**:
- `YYYY-MM-DD-HH-MM-description.md` - 상세 리포트
- `verification-index.json` - 검색 인덱스 (자동 업데이트)

## 히스토리 빠른 검색 (2025-10-02 신규)

**검색 도구**: `scripts/ai-verification/search-history.sh`

**사용 예시**:
```bash
# 최근 3개 검증
./scripts/ai-verification/search-history.sh latest 3

# 특정 대상 검증 히스토리
./scripts/ai-verification/search-history.sh target "subagent"

# 90점 이상 검증
./scripts/ai-verification/search-history.sh score 90

# 태그 검색
./scripts/ai-verification/search-history.sh tag "architecture"

# 평균 점수 추이
./scripts/ai-verification/search-history.sh trend

# 전체 통계
./scripts/ai-verification/search-history.sh stats
```

**성능**:
- 조회 시간: 30초 → 1.5초 (95% 단축)
- verification-index.json 기반 빠른 검색
- 복잡한 쿼리 지원 (jq 기반)

**활용**:
- 개선 추세 추적
- 반복 문제 식별
- 품질 향상 검증
- AI별 성과 비교

→ 상세 내용은 CLAUDE.md AI 교차검증 섹션 참조
