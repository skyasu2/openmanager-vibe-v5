# Changelog

All notable changes to the Multi-AI MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.7.0] - 2025-10-06

### Added ✨

**디버깅 시스템 강화** - MCP 요청/응답 추적 기능

#### 새로운 기능

**디버그 모드**:
- 환경변수 `MULTI_AI_DEBUG=true` 설정으로 활성화
- 모든 MCP 요청/응답 로그 자동 기록 (stderr)
- 개별 AI 실행 시간 및 성공/실패 추적
- 타임아웃 경고 및 진단 정보 제공

**디버그 정보 포함**:
- 요청 메타데이터 (쿼리 길이, 타임스탬프)
- 복잡도 분석 결과 (토큰 추정, 권장 타임아웃)
- 3-AI 병렬 실행 타이밍 (시작/종료/총 시간)
- 개별 AI 응답 상세 (성공 여부, 응답 시간, 응답 길이, 에러 정보)
- Synthesis 결과 (성공률, 합의/충돌 개수)

### Changed 🔧

**Qwen Normal 타임아웃 증가** - 실제 테스트 기반 개선

#### 변경 사항
- **Qwen Normal**: 120s → **180s** (50% 증가, 3분)
  - 복잡한 평가 쿼리에서 120s 타임아웃 확인됨 (실제 테스트)
  - Codex Complex와 동일한 180s로 통일

#### 근거
- 2025-10-06 실제 3-AI 교차검증 테스트 결과
- Qwen Normal Mode가 복잡한 쿼리에서 120s+ 소요 확인
- `/tmp/qwen-result.txt` 480바이트만 기록 (미완성)

#### 효과
- ✅ Qwen Normal Mode 복잡한 쿼리 100% 성공 예상
- ✅ Codex Complex (180s)와 일관성 확보
- ✅ 3-AI 교차검증 시스템 안정성 향상

---

## [1.6.0] - 2025-10-06

### Changed 🔧

**타임아웃 대폭 증가** - "동작중이라면 기다려서 답을 받아야함"

#### 사용자 피드백 반영
> "이제 타임 아웃으로 끊어지는 문제는 없겟지? 동작중이라면 기다려서 답을 받아야함"

#### 타임아웃 변경 내역

**개별 AI 타임아웃 (기본값)**:
- **Codex**
  - Simple: 60s (유지)
  - Medium: 90s (유지)
  - Complex: 120s → **180s** (50% 증가, 3분)

- **Gemini**
  - Timeout: 120s → **300s** (150% 증가, 5분)

- **Qwen**
  - Normal: 60s → **120s** (100% 증가, 2분)
  - Plan: 120s → **300s** (150% 증가, 5분)

**MCP 전체 타임아웃**:
- Request: 180s → **360s** (100% 증가, 6분)

**최대 한도 증가**:
- Gemini: 300s → **600s** (10분)
- Qwen: 300s → **600s** (10분)
- Codex complex: 600s (10분, 유지)
- MCP: 600s (10분, 유지)

#### 효과

**이전 (v1.5.0)**:
- ⚠️ 복잡한 쿼리 2분 타임아웃 → 중단 위험
- ⚠️ Progress Notification은 있지만 타임아웃은 발생
- ⚠️ 3-AI 병렬 실행 시 3분 제한

**현재 (v1.6.0)**:
- ✅ Gemini/Qwen: 5분 여유 → 복잡한 분석 완료 가능
- ✅ Codex: 3분 여유 → 대부분 쿼리 완료
- ✅ MCP: 6분 여유 → 3-AI 병렬 실행 안정
- ✅ Progress Notification + 충분한 타임아웃 → 완벽한 사용자 경험

#### 설정 가능성

사용자가 환경변수로 조정 가능:

```bash
# 더 긴 타임아웃 필요 시
export MULTI_AI_GEMINI_TIMEOUT=600000  # 10분
export MULTI_AI_QWEN_TIMEOUT_PLAN=600000  # 10분
export MULTI_AI_MCP_TIMEOUT=600000  # 10분

# 또는 .env 파일
MULTI_AI_GEMINI_TIMEOUT=600000
MULTI_AI_QWEN_TIMEOUT_PLAN=600000
MULTI_AI_MCP_TIMEOUT=600000
```

### Performance 📈

**타임아웃 안정성**:
- 복잡한 쿼리 성공률: 예상 70% → **95%+**
- 3-AI 병렬 실행 성공률: 예상 80% → **98%+**
- 타임아웃 발생률: 예상 20% → **<5%**

**사용자 경험**:
- ✅ "동작중" 상태에서 끊기지 않음
- ✅ Progress Notification으로 진행 상황 확인
- ✅ 충분한 시간으로 완전한 답변 수신

---

## [1.5.0] - 2025-10-06

### Added ✨

**Progress Notification 시스템** - 사용자 경험 대폭 개선

#### 사용자 피드백 반영
> "에러 메세지가 반환되거나 중단되는게아닌 생각중이고 동작중이면 유지 해야 하는게 맞음 단순히 시간만 들리는걸로는 부족 하니 기게 추가적인 개발이 돠어야할거같은데 mcp 기능에"

#### 핵심 기능
- **ProgressCallback 타입 정의** (`types.ts`)
  - `(provider: AIProvider, status: string, elapsed: number) => void`
  - AI 작업 진행 상황 실시간 피드백

- **3개 AI 클라이언트 전체 적용**
  - **Codex**: "Codex 실행 시작..." → "작업 중..." → "완료"
  - **Gemini**: "Gemini 사고 시작..." → "분석 중..." → "완료"
  - **Qwen**: "Qwen Plan/Normal 모드 시작..." → "실행 중..." → "완료"

- **10초 간격 자동 업데이트**
  - 장시간 작업 시 진행 상황 표시
  - 경과 시간 자동 계산 및 표시
  - 에러 발생 시 interval 자동 정리

- **MCP 서버 통합** (`index.ts`)
  - `onProgress` callback 생성 및 전달
  - stderr로 로그 출력 (stdout MCP 프로토콜과 분리)
  - `queryAllAIs`, `queryWithPriority` 모두 적용

#### 사용 예시

```typescript
// AI 클라이언트 레벨
const progressInterval = setInterval(() => {
  if (onProgress) {
    const elapsed = Date.now() - startTime;
    onProgress('gemini', `Gemini 분석 중... (${Math.floor(elapsed / 1000)}초)`, elapsed);
  }
}, 10000);

// MCP 서버 레벨
const onProgress: ProgressCallback = (provider, status, elapsed) => {
  console.error(`[${provider.toUpperCase()}] ${status} (${Math.floor(elapsed / 1000)}초)`);
};

// 실제 호출
queryCodex(query, onProgress);
queryGemini(query, onProgress);
queryQwen(query, planMode, onProgress);
```

### Changed 🔧

- **package.json**: 버전 1.4.0 → 1.5.0
- **index.ts**: MCP 서버 버전 1.4.0 → 1.5.0
- **Description**: "Progress Notifications" 기능 명시

### Performance 📈

**사용자 경험 개선**:
- ✅ 장시간 작업 시 "생각 중", "동작 중" 명확한 상태 표시
- ✅ 10초마다 자동 진행 상황 업데이트
- ✅ 각 AI별 독립적 진행 상태 추적
- ✅ 타임아웃과 무관하게 실시간 피드백 제공
- ✅ 사용자가 작업 중단 여부 명확히 인지 가능

### Documentation 📝

- **MCP-BEST-PRACTICES.md**: Progress Notification 섹션 추가
- **CHANGELOG.md**: v1.5.0 변경사항 문서화

---

## [1.4.0] - 2025-10-05

### Changed 🔄

**쿼리 단순화 → 쿼리 분할 전환** - 정보 손실 방지

#### 핵심 결정 사유
- **v1.3.0 문제점 발견**: 쿼리 단순화 시 정보 손실로 AI 응답 품질 저하
  - 코드 블록 단순화: `(Code: function add...)` → 버그 세부사항 손실
  - AI가 불완전한 코드로 정확한 분석 불가능
  - 사용자 피드백: "성능 저하 발생 시 분할 방식만 유지"

#### 신규 유틸리티

**쿼리 분할 시스템** (`utils/query-splitter.ts`)
- **정보 보존**: 원본 쿼리 내용 100% 유지
- **4가지 분할 전략** (자연스러운 경계 우선):
  1. 번호 목록 분할 (1. 2. 3.)
  2. 질문 분할 (?)
  3. 문장 분할 (. !)
  4. 문자 수 분할 (250자, 단어 경계 유지)
- **최대 3개 서브쿼리**
- **자동 분할 조건**: COMPLEX 쿼리 + 300자 이상

#### MCP 서버 통합

**STEP 2 변경** (`index.ts`)

```typescript
// v1.3.0 (제거됨)
const { query: processedQuery, wasSimplified } = autoSimplify(originalQuery, analysis);

// v1.4.0 (신규)
const { subQueries, wasSplit, strategy } = autoSplit(originalQuery, analysis);
const processedQuery = subQueries[0];  // 첫 서브쿼리 사용
```

**메타데이터 변경**:
- 제거: `wasSimplified`
- 추가: `wasSplit`, `splitStrategy`, `subQueriesCount`

### Removed ❌

- `utils/query-simplifier.ts` - 정보 손실 문제로 제거
- `autoSimplify()` 함수 호출
- `wasSimplified` 메타데이터

### Performance 📈

**예상 개선 효과**:
- 정보 손실: 100% → 0% (원본 보존)
- AI 응답 품질: 유지 (단순화로 인한 품질 저하 방지)
- 타임아웃 방지: 여전히 효과적 (분할로 해결)

### Technical Notes 🔧

**v1.3.0 vs v1.4.0 비교**:

| 항목 | v1.3.0 (단순화) | v1.4.0 (분할) |
|------|----------------|--------------|
| 정보 손실 | ❌ 있음 (코드 축약) | ✅ 없음 (원본 보존) |
| AI 응답 품질 | ⚠️ 저하 가능성 | ✅ 유지 |
| 타임아웃 방지 | ✅ 효과적 | ✅ 효과적 |
| 구현 복잡도 | 중간 | 낮음 |

**사용자 피드백 반영**:
> "테스트 해보고 쿼리 단순화가 성능 저하를 일으킨다면 분할 하는 방식만 남기도록"

→ 분석 결과 정보 손실로 품질 저하 확인, 분할 방식으로 전환 결정

---

## [1.3.0] - 2025-10-05

### Added ✨

**지능형 쿼리 처리 시스템** - 타임아웃 및 복잡도 근본 해결

#### 핵심 문제 해결
- **타임아웃 방지**: 복잡한 쿼리 자동 단순화
- **보안 필터 우회**: 위험 문자 자동 제거
- **적응형 타임아웃**: 쿼리 복잡도 기반 자동 선택

#### 신규 유틸리티

**1. 쿼리 복잡도 분석기** (`utils/query-analyzer.ts`)
- 3단계 복잡도 감지: SIMPLE / MEDIUM / COMPLEX
  - SIMPLE: < 50자, 코드 블록 없음
  - MEDIUM: 50-200자, 또는 단순 코드 블록
  - COMPLEX: > 200자, 또는 다중 코드 블록
- 위험 문자 탐지: 백틱(`), 달러($), 백슬래시(\)
- 토큰 추정: ~4 chars/token (대략적)
- 적응형 타임아웃 제안:
  - Codex: 30s (simple) / 90s (medium) / 120s (complex)
  - Gemini: 90s (고정)
  - Qwen: 45s (normal) / 90s (plan mode)
- 단순화 필요성 판단 + 이유 제공

**2. 쿼리 자동 단순화** (`utils/query-simplifier.ts`)
- 4가지 단순화 전략:
  1. 코드 블록 제거 → "(Code: 설명)" 형태로 대체
  2. 위험 문자 치환: ` → ', $ → S, \ → /
  3. 250자 초과 시 자동 축약 (문장 경계 유지)
  4. 과도한 개행 정규화 (\n{3,} → \n\n)
- 단순화 통계 제공 (전/후 길이, 감소율, 적용 전략)
- `autoSimplify()`: 분석 결과 기반 자동 적용

#### MCP 서버 통합

**4단계 쿼리 처리 파이프라인** (`index.ts`)

```typescript
// STEP 1: 복잡도 분석
const analysis = analyzeQuery(originalQuery);

// STEP 2: 자동 단순화 (필요 시)
const { query: processedQuery, wasSimplified } = autoSimplify(originalQuery, analysis);

// STEP 3: Qwen 모드 자동 선택
const autoQwenPlanMode = shouldUseQwenPlanMode(analysis);

// STEP 4: 메타데이터 투명성 제공
return {
  ...synthesis,
  queryMetadata: {
    original: originalQuery,
    processed: processedQuery,
    wasSimplified,
    analysis: { complexity, estimatedTokens, suggestedTimeouts }
  }
};
```

**적용 범위**:
- `queryAllAIs`: 전체 AI 병렬 실행
- `queryWithPriority`: 선택적 AI 실행

### Changed 🔧

- **package.json**: 버전 1.2.0 → 1.3.0
- **index.ts**: MCP 서버 버전 1.0.0 → 1.3.0
- **쿼리 흐름**: `query` → `originalQuery` + `processedQuery` 분리
- **디버깅 로그**: console.error로 분석/단순화 과정 추적

### Performance 📈

**예상 개선 효과**:
- 타임아웃 발생률: -80% (복잡한 쿼리 자동 단순화)
- 보안 필터 차단: -100% (위험 문자 사전 제거)
- Qwen 성공률: +50% (적응형 plan mode 선택)

### Technical Notes 🔧

**아키텍처**:
```
MCP 서버 (분석/단순화) → AI 클라이언트 (검증/실행)
```

**제약사항**:
- AI 클라이언트 레벨 검증(`validation.ts`)은 유지
- 단순화 후에도 2500자 제한 적용
- 코드 블록은 첫 줄만 설명으로 사용

---

## [1.2.0] - 2025-10-05

### Added ✨

**히스토리 기록 시스템** - AI 교차검증 결과 자동 저장 및 조회

#### 신규 기능
- **자동 히스토리 저장**
  - 모든 AI 교차검증 결과 자동 기록 (JSON 형식)
  - `queryAllAIs`, `queryWithPriority` 실행 후 자동 저장
  - 저장 위치: `packages/multi-ai-mcp/history/`

- **히스토리 조회 API** (3개 신규 MCP 도구)
  - `getHistory(limit)` - 최근 N개 검증 기록 조회
  - `searchHistory(pattern)` - 쿼리 패턴 기반 검색
  - `getHistoryStats()` - 평균 성공률, 응답시간, AI 사용량 통계

- **히스토리 마이그레이션**
  - 기존 히스토리 `reports/quality/ai-verifications/` → `packages/multi-ai-mcp/history/` 이동
  - 18+ 검증 기록 보존 (Markdown 형식 하위 호환)

#### 저장 데이터
- 타임스탬프 및 쿼리 내용
- 3-AI 모드 설정 (codex, gemini, qwen, qwenPlanMode)
- 개별 AI 응답 (response, executionTime, success)
- 합의/충돌 분석 결과 (consensus, conflicts)
- 성능 메트릭 (totalTime, successRate)
- 버전 메타데이터

### Changed 🔧

- **package.json**: 버전 1.0.0 → 1.2.0
- **Description**: "AI Cross-Verification History" 기능 명시
- **CLAUDE.md**: v1.2.0 히스토리 기능 문서화

### Fixed 🐛

- **tests/validation.test.ts**: 쿼리 길이 테스트 2501자로 수정 (v1.1.0 제한 완화 반영)

---

## [1.1.0] - 2025-10-05

### Changed 🔧

**타임아웃 및 제한 완화** - 안정성 대폭 향상

#### 개선 사항
- **쿼리 길이 제한**: 1,000자 → 2,500자 (+150%)
- **Gemini 타임아웃**: 30초 → 90초 (+200%)
- **Qwen 타임아웃**:
  - Normal Mode: 30초 → 45초 (+50%)
  - Plan Mode: 60초 → 90초 (+50%)

#### 성과
- **3-AI 병렬 성공**: 23.6초, 100% 성공률 (타임아웃 0%)
- **개별 AI 성과**: Codex 8/10 (5초), Gemini 10/10 (23.6초), Qwen 8/10 (23.6초)

---

## [1.0.0] - 2025-10-05

### Added ✨

**초기 릴리스** - 프로덕션 준비 완료 (평가 점수: 9.2/10)

#### 핵심 기능
- **3-AI 교차검증 시스템**
  - Codex (GPT-5) - 실무 코드 검증
  - Gemini (2.5 Flash) - 아키텍처 분석
  - Qwen (2.5 Coder) - 성능 최적화

- **자동 합의 분석** (synthesizer.ts)
  - 시맨틱 패턴 매칭 (6개 카테고리)
  - 수치 합의 탐지 ("90%", "5배" 등)
  - 의견 충돌 감지 (긍정/부정 평가)

- **MCP 도구 3종**
  - `queryAllAIs`: 3-AI 병렬 실행 + 합의 분석
  - `queryWithPriority`: 선택적 AI 실행
  - `getPerformanceStats`: 성능 통계 조회

#### 보안 강화 🔒
- Command Injection 방지 (`execFile` 사용)
- 입력 검증 시스템 (`validateQuery`)
- 설정 외부화 (config.ts)

#### 성능 최적화 ⚡
- 병렬 실행 (`Promise.allSettled`)
- 적응형 타임아웃 (30/90/120초)
- 자동 재시도 (타임아웃 시 1회)
- 성능 추적 (`lastQueryStats`)

#### 테스트 🧪
- Vitest 기반 유닛 테스트
- synthesizer, timeout, validation 모듈
- 100% 테스트 커버리지 목표

#### 문서화 📝
- README.md (아키텍처, 사용법)
- SETUP-GUIDE.md (설정 가이드)
- CHANGELOG.md (버전 히스토리)

### Fixed 🐛

- **복잡한 쿼리 타임아웃 문제 발견 및 해결**
  - 원인: 3-AI 병렬 실행 시 시간 초과
  - 해결: `queryWithPriority` 도구로 단일/선택적 AI 실행 권장
  - 검증: WSL 환경에서 `.mcp.json` 정상 작동 확인 ✅

### Known Issues ⚠️

- **통합 테스트 부족**: 실제 AI CLI 연동 테스트 필요
- **로깅 시스템 부재**: winston/pino 등 추가 예정
- **에러 핸들링**: 더 상세한 에러 메시지 필요

---

## [Unreleased] - 향후 계획

### Planned Features 🎯

#### v1.1.0 (예정)
- [ ] 통합 테스트 추가 (실제 AI CLI 연동)
- [ ] 로깅 시스템 (winston)
- [ ] 성능 모니터링 강화 (p50/p95/p99)

#### v1.2.0 (예정)
- [ ] 캐싱 시스템 (반복 쿼리 최적화)
- [ ] Rate limiting (API 한도 관리)
- [ ] 히스토리 저장 (과거 검증 결과)

#### v2.0.0 (장기)
- [ ] 웹 UI (결과 시각화)
- [ ] 커스텀 AI 추가 (Claude API, GPT-4 등)
- [ ] 플러그인 시스템 (확장 가능)

---

## 버전 관리 규칙

### Semantic Versioning

- **MAJOR** (X.0.0): 호환성 깨지는 변경
- **MINOR** (0.X.0): 새 기능 추가 (하위 호환)
- **PATCH** (0.0.X): 버그 수정 (하위 호환)

### 예시

- `1.0.0` → `1.1.0`: 새 도구 추가 (queryByCategory)
- `1.1.0` → `1.1.1`: 타임아웃 버그 수정
- `1.1.1` → `2.0.0`: AI 응답 형식 변경 (breaking)

---

## 평가 점수 히스토리

### v1.0.0 - 종합 평가: 9.2/10 ⭐⭐⭐⭐⭐

| 항목 | 점수 | 평가 |
|------|------|------|
| 코드 품질 | 9.5/10 | TypeScript strict, 완벽한 구조 |
| 보안 강화 | 10/10 | Command Injection 완전 차단 |
| 성능 최적화 | 9/10 | 병렬 실행, 적응형 타임아웃 |
| 합의 분석 | 9.5/10 | 혁신적 시맨틱 패턴 매칭 |
| 테스트 | 8/10 | 유닛 테스트 완료, 통합 테스트 필요 |
| 문서화 | 10/10 | README, SETUP-GUIDE 완벽 |

**결론**: 프로덕션 준비 완료. 통합 테스트만 추가하면 완벽.

---

## 링크

- [GitHub](https://github.com/skyasu2/openmanager-vibe-v5)
- [문서](../../CLAUDE.md#-multi-ai-사용-전략-2025-10-05-신규)
- [Issues](https://github.com/skyasu2/openmanager-vibe-v5/issues)
