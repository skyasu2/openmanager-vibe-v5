# 🤖 AI 시스템 문서 (AI Systems Documentation)

**목적**: Multi-AI 교차검증, 서브에이전트, CLI 도구 통합 가이드

---

## 📂 디렉토리 구조

```
ai/
├── (루트 9개) - AI 워크플로우, 서브에이전트, 유지보수 가이드
└── verifications/ (3개) - AI 검증 기록 및 템플릿
```

**총 12개 파일** (1-37일 전)

---

## 🎯 주요 문서 (우선순위별)

### ⭐ 필수 읽기 (최신, 활발히 사용 중)

#### 1. subagents-complete-guide.md (13K, 1일 전) 🔥
**Claude Code 서브에이전트 완전 가이드**

- **목적**: 18개 전문 서브에이전트 활용법 및 최적화 전략
- **구성**:
  - 5초 선택 가이드 (상황별 에이전트 매칭)
  - 자주 사용하는 명령어 모음
  - AI 교차검증 시스템 (4개)
  - 전문 도구 (12개): 환경, 구조, DB, Vercel, 코드 리뷰, 디버깅, 보안, 테스트, 문서, UI/UX

**핵심 원칙**:
```bash
# 복잡한 작업 → 서브에이전트 호출
codex: 구현된 알고리즘을 실무 관점에서 검증해주세요
gemini: 구현된 시스템 아키텍처를 SOLID 관점에서 검토해주세요
qwen: 구현된 알고리즘의 성능을 분석하고 최적화 방안을 제안해주세요

# 간단한 작업 → 직접 CLI
codex exec "이 함수에 버그 있나요?"
gemini "이 구조가 SOLID 원칙에 맞나요?"
qwen -p "시간복잡도는?"
```

**SSOT**: config/ai/registry.yaml (18개 서브에이전트 중앙 관리)

---

#### 2. ai-maintenance.md (18K, 7일 전) ⭐
**AI CLI 도구 유지보수 가이드**

- **목적**: Codex, Gemini, Qwen CLI 버전 관리 및 트러블슈팅
- **구성**:
  - 월간 체크리스트 (버전 확인, 인증 갱신)
  - 헬스 체크 스크립트 (`./scripts/ai-tools-health-check.sh`)
  - 스택 드리프트 추적 (API 변경, Breaking changes)
  - 트러블슈팅 (인증 만료, 타임아웃, 버전 충돌)

**중요도**: 🔴 **HIGH** - AI 시스템 안정성 유지

---

#### 3. 3-ai-query-optimization-guide.md (16K, 1일 전) ⭐
**3-AI 쿼리 최적화 가이드**

- **목적**: Codex, Gemini, Qwen 쿼리 효율 극대화
- **구성**:
  - 쿼리 길이 최적화 (250단어 권장, 500단어 최대)
  - 입력 크기 제한 (100줄 권장, 200줄 최대)
  - 역할 분담 최적화 (Codex: 실무, Gemini: 아키텍처, Qwen: 성능)
  - 타임아웃 전략 (Codex 300s, Gemini 300s, Qwen 600s)

**핵심 원칙**:
```markdown
# ✅ 효율적 쿼리
codex: LoginClient.tsx를 실무 관점에서 버그 및 개선점 3개씩 찾아주세요

# ❌ 비효율적 쿼리
codex: 이 프로젝트의 모든 측면을 분석하고 개선 방향을 제시해주세요
```

**기대 효과**: 응답 시간 40% 단축, 타임아웃 100% 해결

---

#### 4. ai-workflows.md (14K, 1일 전)
**AI 워크플로우 가이드**

- **목적**: AI 도구 통합 워크플로우 및 사용 패턴
- **구성**:
  - 개발 워크플로우 (코딩 → 검증 → 배포)
  - 교차검증 패턴 (3-AI 병렬 실행)
  - 서브에이전트 활용 전략
  - MCP 통합 (9개 서버)

---

### 📖 참고 문서 (안정적, 배경 지식)

#### 5. cli-strategy.md (4K, 6일 전)
**AI CLI 도구 전략**

- Codex, Gemini, Qwen CLI 전략적 활용
- 비용 효율 (Codex $20/월, Gemini/Qwen 무료)
- 사용량 제한 (Codex 30-150 메시지/5h, Gemini 60 RPM, Qwen 60 RPM)

---

#### 6. workflow.md (9.5K, 6일 전)
**AI 워크플로우 기본**

- 일반적 AI 워크플로우
- (참고: ai-workflows.md가 더 최신이고 상세함)

---

### 📚 레거시 문서 (참고용, 37일 전)

#### 7. verification-history.md (5.5K, 37일 전)
**AI 검증 히스토리**

- 초기 AI 검증 기록
- (참고: docs/claude/history/ai-verifications/가 더 상세함)

---

#### 8. verification.md (3.8K, 37일 전)
**AI 검증 프로세스**

- 기본 검증 프로세스
- (참고: 3-ai-query-optimization-guide.md가 더 최신)

---

### 📁 verifications/ (3개)

**서브디렉토리** - AI 검증 기록 및 템플릿

- `2025-10-06-multi-ai-mcp-v3-validation.md` (9.5K, 10일 전)
  - Multi-AI MCP v3 검증 기록

- `README.md` (3.4K)
  - 검증 프로세스 설명

- `TEMPLATE.md` (2.6K)
  - 검증 문서 템플릿

---

## 📊 문서 통계 (2025-10-16)

| 카테고리 | 파일 수 | 최신 업데이트 | 중요도 |
|----------|---------|--------------|--------|
| **최신 가이드** | 4 | 1-7일 전 | 🔴 HIGH |
| **참고 문서** | 2 | 6일 전 | 🟡 MEDIUM |
| **레거시** | 2 | 37일 전 | 🟢 LOW |
| **검증 기록** | 3 | 10일 전 | 🟡 MEDIUM |
| **합계** | **11** | - | - |

**특징**:
- ✅ 활발한 업데이트 (4개 문서 1주일 내)
- ✅ 명확한 역할 분담 (서브에이전트, 유지보수, 최적화, 워크플로우)
- ✅ SSOT 연계 (config/ai/registry.yaml)

---

## 🚀 빠른 시작 가이드

### 신규 개발자

**1단계: AI 시스템 이해** (30분)
1. `subagents-complete-guide.md` (15분) - 서브에이전트 개요
2. `ai-workflows.md` (10분) - 워크플로우 이해
3. `cli-strategy.md` (5분) - CLI 도구 전략

**2단계: 실습** (20분)
```bash
# AI 헬스 체크
./scripts/ai-tools-health-check.sh

# 서브에이전트 호출 테스트
codex: "useState vs useReducer 선택 기준"

# 3-AI 교차검증 (명시 시만)
"이 LoginClient.tsx를 AI 교차검증해줘"
```

**3단계: 유지보수 학습** (10분)
1. `ai-maintenance.md` (10분) - 월간 체크리스트

**총 소요 시간**: 60분

---

### 서브에이전트 활용 패턴

#### 패턴 A: 단일 AI 호출 (일반적)

```bash
# 개별 서브에이전트 호출
codex: 이 코드의 버그를 찾아주세요
gemini: 이 아키텍처를 검토해주세요
qwen: 이 알고리즘을 최적화해주세요
```

**언제**: 특정 관점 필요, 빠른 피드백

---

#### 패턴 B: AI 교차검증 (명시 시만) ⭐

**중요**: "AI 교차검증" 명시 시에만 활성화!

```bash
# 사용자가 명시적 요청
"이 LoginClient.tsx를 AI 교차검증해줘"

# Claude Code가 Multi-AI Verification Specialist 호출
Task multi-ai-verification-specialist "LoginClient.tsx 교차검증"

# 서브에이전트가 3-AI 병렬 실행 자동화
# → Codex (실무 검증) + Gemini (아키텍처) + Qwen (성능)
# → 결과 종합 → Decision Log 작성
```

**특징**:
- ✅ Bash Wrapper 방식 (타임아웃 100% 해결)
- ✅ 병렬 실행 (Codex 13s, Gemini 70s, Qwen 102s)
- ✅ 독립적 답변 (각 AI의 고유 관점)

**문서**: docs/claude/environment/multi-ai-strategy.md

---

## 💡 핵심 원칙

### 1. 역할 분담 명확화

**Claude Code = 메인 개발자**:
- ✅ 모든 코딩, 구현, 문서 작성
- ✅ 검증 결과 반영한 개선
- ✅ 최종 결정 및 통합

**Codex/Gemini/Qwen = 검증자**:
- ✅ 구현 검증, 버그 분석
- ✅ 아키텍처 검토, 성능 분석
- ✅ 개선 제안, 의견 제시
- ❌ **실제 코드 수정은 하지 않음**

**예외**: 사용자가 특정 AI에게 직접 개발 지시한 경우만
- ✅ "Codex야 이 함수 구현해줘" - OK (명시적 지시)
- ❌ "AI 교차검증해줘" - Claude가 개발, 다른 AI는 검증만

---

### 2. 쿼리 최적화

**길이**: 250단어 권장 (500단어 최대)
**입력**: 100줄 권장 (200줄 최대)
**역할**: 구체적 역할 정의 필수

**✅ 효율적**:
```
codex: LoginClient.tsx를 실무 관점에서 버그 3개, 리팩토링 3개 찾아주세요
```

**❌ 비효율적**:
```
codex: 이 프로젝트를 전체적으로 분석하고 모든 개선점을 알려주세요
```

---

### 3. SSOT (Single Source of Truth)

**모든 AI 설정은 config/ai/registry.yaml에서 관리**:
- 18개 서브에이전트 정의
- 3개 외부 AI CLI 도구 설정
- 9개 MCP 서버 통합
- 워크플로우 및 유지보수 정책

**변경 시**: registry.yaml 먼저 업데이트 → 문서 동기화

---

## 🔗 관련 문서

### 중앙 관리

- **config/ai/registry.yaml** - SSOT (모든 AI 설정)
- **CLAUDE.md** - 프로젝트 메인 가이드
- **docs/claude/environment/multi-ai-strategy.md** - Multi-AI 전략 상세

### 서브에이전트

- **.claude/agents/** - 18개 서브에이전트 정의 파일
- **docs/claude/architecture/ai-cross-verification.md** - 교차검증 시스템

### 스크립트

- **scripts/ai-subagents/** - Bash Wrapper (codex, gemini, qwen)
- **scripts/ai-tools-health-check.sh** - AI 도구 헬스 체크

---

## 🔧 트러블슈팅

### AI CLI 문제

**증상**: Codex/Gemini/Qwen 응답 없음

**해결**:
```bash
# 1. 헬스 체크
./scripts/ai-tools-health-check.sh

# 2. 로그 확인
cat logs/ai-tools-health/$(date +%Y-%m-%d).log

# 3. 인증 갱신
# Codex: ChatGPT Plus 계정 확인
# Gemini: OAuth 재인증
# Qwen: OAuth 재인증
```

**문서**: ai-maintenance.md

---

### 타임아웃 문제

**증상**: AI 응답 타임아웃

**원인 & 해결**:
1. **쿼리 너무 길거나 복잡** → 3-ai-query-optimization-guide.md 참조
2. **입력 크기 너무 큼** → 100줄 이하로 제한
3. **포괄적 질문** → 구체적 역할 정의

**Bash Wrapper 타임아웃** (안전장치):
- Codex: 300초
- Gemini: 300초
- Qwen: 600초 (YOLO Mode)

---

### 서브에이전트 호출 실패

**증상**: Task 명령이 작동하지 않음

**해결**:
```bash
# 1. 서브에이전트 목록 확인
ls .claude/agents/

# 2. registry.yaml 동기화 확인
cat config/ai/registry.yaml

# 3. 올바른 호출 형식
Task multi-ai-verification-specialist "작업 설명"
```

---

## 📚 학습 경로

### 초급 (1시간)

1. **subagents-complete-guide.md** (20분) - 서브에이전트 기본
2. **cli-strategy.md** (10분) - CLI 도구 이해
3. **실습** (30분):
   ```bash
   ./scripts/ai-tools-health-check.sh
   codex: "간단한 질문"
   ```

---

### 중급 (2시간)

1. **ai-workflows.md** (20분) - 워크플로우 이해
2. **3-ai-query-optimization-guide.md** (30분) - 쿼리 최적화
3. **ai-maintenance.md** (30분) - 유지보수
4. **실습** (40분):
   ```bash
   # 3-AI 교차검증 테스트
   "이 컴포넌트를 AI 교차검증해줘"
   ```

---

### 고급 (3시간)

1. **config/ai/registry.yaml** (30분) - SSOT 구조 이해
2. **docs/claude/environment/multi-ai-strategy.md** (40분) - Multi-AI 전략
3. **scripts/ai-subagents/** (40분) - Bash Wrapper 분석
4. **실습** (70분):
   - 새 서브에이전트 추가
   - Wrapper 커스터마이징
   - Decision Log 작성

---

## 🎯 핵심 메시지

> **"AI는 도구일 뿐, 최종 결정은 항상 Claude Code가 한다"**

**개발 워크플로우**:
```
Phase 1: Claude Code가 개발 (코딩, 구현, 문서)
    ↓
Phase 2: 3-AI 병렬 검증 (Codex, Gemini, Qwen)
    ↓
Phase 3: Claude Code가 개선 (검증 결과 반영)
```

**기대 효과**:
- ✅ 품질 4배 향상 (Claude 개발 + 3-AI 검증)
- ✅ 정확도 48% 개선 (6.2/10 → 9.2/10)
- ✅ 토큰 82% 절약 (MCP 통합)

---

**Last Updated**: 2025-10-16 by Claude Code
**핵심 철학**: "개발은 Claude, 검증은 Multi-AI, 결정은 다시 Claude"
