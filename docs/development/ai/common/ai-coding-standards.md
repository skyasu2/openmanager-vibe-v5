# AI 코딩 규칙 통합 가이드

**공통 코딩 표준** - Codex, Gemini, Qwen, Claude Code 모두 준수

최종 업데이트: 2025-12-19

---

## 📋 핵심 코딩 규칙

모든 AI 도구(Codex, Gemini, Qwen, Claude Code)는 다음 규칙을 준수하여 코드를 생성합니다.

### 1. 가독성 (Readability)

- **명확한 네이밍**: `userCount` vs `u` 처럼 의도가 드러나는 이름 사용
- **함수 분리**: 하나의 함수는 "한 가지 일"만 수행. 복잡한 로직은 하위 함수로 분할
- **스타일 준수**: 프로젝트의 들여쓰기, 줄바꿈 등 컨벤션 일관성 유지

### 2. 간결함 & 단순함 (Simplicity & Clarity)

- **KISS 원칙**: 과도한 기교보다 단순하고 명료한 구현 우선
- **매직 넘버 제거**: 하드코딩된 숫자/문자열은 의미 있는 상수로 대체
- **UX Obsession**: 사용자 경험 최우선 (Premium Quality)

### 3. 유지보수성 & 확장성 (Maintainability & Scalability)

- **미래 고려**: 단순 스크립트와 확장 가능한 코드의 접근 방식 구분
- **구조화**: 모듈화, 관심사 분리(SoC), 응집도/결합도 고려 (SOLID 원칙)

### 4. 일관성 (Consistency)

- **컨벤션 엄수**: 팀/프로젝트 단위의 네이밍, 주석, 커밋 메시지 규칙 따르기
- **협업 효율**: 일관된 스타일로 리뷰 속도 향상 및 실수 방지

### 5. 테스트 & AI 상호 검증 (Testing & AI Verification)

- **테스트 필수**: 핵심 로직 및 라이브러리는 단위 테스트(Unit Test) 확보
- **상호 검증**: 작성된 코드는 반드시 **다른 AI(Claude, Gemini, Codex, Qwen)**의 리뷰를 거쳐 잠재적 문제 해결

### 6. 문서화 (Documentation)

- **Why 주석**: 코드가 "무엇"을 하는지보다 "왜" 그렇게 했는지 설명
- **자체 설명**: 이상적인 코드는 주석 없이도 이해 가능하도록 작성

---

## 🎯 TypeScript 엄격 모드 준수

### Type-First 원칙

1. **타입 정의 우선**: 구현 전 인터페이스와 타입 정의를 먼저 작성하고 검증
2. **No `any`**: `any` 타입 사용을 엄격히 금지. 필요시 제네릭이나 유틸리티 타입 활용
3. **컴파일 체크**: 코드 변경 후 반드시 `npm run type-check` 실행

### 기존 코드 분석

- **의존성 파악**: 리팩토링 대상 파일이 참조하는 모든 타입과 모듈을 사전에 분석
- **레거시 호환성**: 기존 인터페이스와의 호환성을 유지하며 점진적으로 변경
- **영향도 분석**: 변경 사항이 다른 모듈에 미칠 영향을 미리 예측하고 문서화

---

## 🤝 AI 협업 프로토콜

### Pre-Development Checklist

작업 시작 전 다음 항목을 확인하세요:

1. **Context**: 목표와 제약사항을 정확히 이해했는가?
2. **Duplication**: 이미 존재하는 기능인가? (@serena 코드 검색)
3. **Impact**: 이 변경이 다른 모듈에 미칠 영향은?
4. **Simplicity**: 더 단순한 해결책은 없는가?

### Code Review Standards

리뷰 시 다음 핵심 코딩 규칙을 기준으로 검증합니다:

- **가독성 (Readability)**: 변수명, 함수 분리 적절성 확인
- **간결함 (Simplicity)**: 매직 넘버, 과도한 복잡성 확인 (KISS)
- **유지보수성 (Maintainability)**: SOLID 원칙 준수 여부
- **테스트 (Testing)**: 주요 로직 테스트 커버리지 확인
- **상호 검증 (Cross-Check)**: 다른 AI 도구와의 교차 검증 여부 확인

### AI 도구별 특화 영역

| AI 도구    | 특화 영역                     | 코딩 규칙 강조점               |
| ---------- | ----------------------------- | ------------------------------ |
| **Codex**  | 코드 리뷰 & 검증              | Simplicity, UX Obsession       |
| **Gemini** | 범용 개발 파트너              | TypeScript Strict, Cross-Check |
| **Qwen**   | 성능 최적화                   | Simplicity, Scalability        |
| **Claude** | 아키텍처 설계 & 비즈니스 로직 | Type-First, Side-Effect First  |

---

## 📚 관련 문서

- **루트 파일**: CLAUDE.md, AGENTS.md (Codex), GEMINI.md, QWEN.md
- **AI 벤치마크**: <!-- Imported from: docs/ai/ai-benchmarks.md -->
- **협업 가이드**: <!-- Imported from: docs/ai/ai-collaboration-architecture.md -->

---

**핵심**: 모든 AI 도구는 동일한 코딩 표준을 준수하여 일관성 있는 코드베이스를 유지합니다.
