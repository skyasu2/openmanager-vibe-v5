# AI Decision Log 시스템

**목적**: Claude Code + 3-AI 교차검증의 **의사결정 기록 저장소**

---

## 📁 디렉토리 구조

```
logs/ai-decisions/
├── README.md (이 파일)
├── TEMPLATE.md (템플릿)
├── archive/ (보관된 Decision Logs - 로컬 전용)
│   ├── README.md (아카이브 가이드)
│   └── [18개 보관 파일, 2025-10-17 ~ 2025-10-24]
└── 2025-10-25-[주제].md (활성 Decision Logs)
```

**아카이브 디렉토리 (`archive/`)**:

- **목적**: 7일 이상 경과하거나 완료된 프로젝트 단계 관련 Decision Log 보관
- **상태**: Git-ignored (`.gitignore`로 제외, 로컼 작업 파일)
- **접근**: `archive/README.md` 참조하여 보관 파일 목록 및 카테고리 확인
- **유지보수**: 자동 아카이빙 (Claude Code)

**파일명 규칙**: `YYYY-MM-DD-[주제-kebab-case].md`

---

## 🎯 핵심 철학

### ❌ 저장하지 않는 것

- 개별 AI의 긴 원본 출력 (codex-output.txt, gemini-output.txt 등)
- 실행 과정의 로그
- 메타데이터 JSON

### ✅ 저장하는 것

- **각 AI의 핵심 주장** (3-5줄 요약)
- **합의점과 충돌점**
- **최종 결정과 근거**
- **실행 내역** (무엇을 했고, 무엇을 할 것인지)

---

## 🚀 사용 방법

### 1단계: 3-AI 교차검증 실행

```bash
./scripts/ai-wrappers/quick-cross-verify.sh "useState vs useReducer 선택 기준"
```

**결과**: 터미널에 3-AI 출력이 표시됨 (저장 안 됨)

### 2단계: Claude Code가 Decision Log 작성

Claude가 위 출력을 읽고 다음 작업 수행:

1. 각 AI 의견을 3-5줄로 요약
2. 합의점과 충돌점 분석
3. 최종 결정 도출 및 근거 제시
4. `logs/ai-decisions/YYYY-MM-DD-[주제].md` 파일 작성

### 3단계: 결정 실행

Decision Log에 기록된 "실행 내역"을 따라 작업 수행

---

## 📋 템플릿 구조

각 Decision Log는 다음 섹션 포함:

1. **상황**: 무엇을 결정해야 했는가?
2. **AI 의견 요약**: 각 AI가 무엇을 주장했는가?
3. **합의점과 충돌점**: 어디서 일치하고 어디서 갈렸는가?
4. **최종 결정**: 무엇을 선택했고 왜 그랬는가?
5. **실행 내역**: 무엇을 했고 무엇을 할 것인가?

---

## 💡 가치

### 기존 시스템 (logs/ai-cross-verification/)

- **문제**: 개별 출력 파일만 저장 → 재참조 어려움
- **결과**: 디스크만 차지, 의사결정 히스토리 없음

### 새 시스템 (logs/ai-decisions/)

- **장점**: 의사결정 히스토리 명확
- **결과**: 지식 베이스로 활용 가능
- **효과**: 왜 그렇게 결정했는지 추후 확인 가능

---

## 🔧 기존 시스템과 관계

### 병존 전략

**logs/ai-cross-verification/** (기존):

- 상세한 원본 출력 필요 시 사용
- 자동화된 스크립트가 호출
- 10개까지 자동 보관

**logs/ai-decisions/** (신규):

- 인간이 읽고 참조하는 의사결정 기록
- Claude가 수동으로 작성
- 영구 보관

### 마이그레이션

기존 검증 결과를 Decision Log로 변환:

```bash
# 예시: 이전 검증 결과를 읽고 Decision Log 작성
cat logs/ai-cross-verification/2025-10-10/110759-useState-vs-useReducer--/summary.md

# Claude가 읽고 logs/ai-decisions/ 에 새 파일 작성
```

---

## 📊 예시

**좋은 Decision Log 예시**: `2025-10-10-useState-vs-useReducer.md`

**포함 내용**:

- 3-AI 의견이 명확하게 요약됨
- 합의와 충돌이 분석됨
- 최종 결정이 근거와 함께 제시됨
- 향후 계획이 명시됨

---

## 🎯 사용 시나리오

### 1. 아키텍처 결정

```bash
./scripts/ai-wrappers/quick-cross-verify.sh "인증 시스템 리팩토링 방향"
# → Claude가 Decision Log 작성
# → logs/ai-decisions/2025-10-10-auth-refactor.md
```

### 2. 성능 최적화

```bash
./scripts/ai-wrappers/quick-cross-verify.sh "대시보드 렌더링 최적화 전략"
# → Claude가 Decision Log 작성
# → logs/ai-decisions/2025-10-10-dashboard-perf.md
```

### 3. 보안 리뷰

```bash
./scripts/ai-wrappers/quick-cross-verify.sh "로그인 보안 취약점 분석"
# → Claude가 Decision Log 작성
# → logs/ai-decisions/2025-10-10-login-security.md
```

---

## 🔗 관련 문서

- **실행 스크립트**: `scripts/ai-wrappers/quick-cross-verify.sh`
- **템플릿**: `logs/ai-decisions/TEMPLATE.md`
- **Multi-AI 전략**: `docs/claude/environment/multi-ai-strategy.md`
- **AI 교차검증 시스템**: `docs/claude/architecture/ai-cross-verification.md`

---

**핵심**: "과정"이 아닌 "결정"을 저장합니다.
