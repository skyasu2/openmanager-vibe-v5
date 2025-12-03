# AI 도구 사용 가이드라인

**DO/DON'T 통합 가이드** - Codex, Gemini, Qwen, Claude Code

최종 업데이트: 2025-11-27

---

## ✅ 공통 DO (권장 사항)

### 모든 AI 도구 공통

1. **교차 검증 활용**
   - 다른 AI 도구의 결과물을 재확인
   - 중요한 결정사항은 2개 이상 AI로 검증

2. **명확한 컨텍스트 제공**
   - 목표와 제약사항을 명시적으로 전달
   - 프로젝트 환경(Node.js, TypeScript, Next.js 등) 명시

3. **실행 및 테스트 검증**
   - AI 제안을 맹목적으로 신뢰하지 않음
   - 항상 실제 실행 및 테스트로 검증

4. **한국어 우선 답변**
   - 기술용어는 영어 병기 허용
   - 모든 답변은 한국어로 제공

---

## ❌ 공통 DON'T (금지 사항)

### 모든 AI 도구 공통

1. **무료 티어 한도 초과**
   - Codex: 30-150 메시지/5시간
   - Gemini: 1,000 RPD, 60 RPM
   - Qwen: 2,000/day, 60/minute

2. **맹목적 신뢰**
   - AI 제안을 검증 없이 적용하지 않음
   - 항상 실행 및 테스트로 확인

3. **컨텍스트 없는 질문**
   - 프로젝트 환경을 명시하지 않은 질문
   - 목표가 불명확한 요청

---

## 🎯 도구별 특화 가이드라인

### Codex CLI (GPT-5 v0.58.0)

#### DO ✅

- CLI 기반 코드 리뷰 & 검증 활용
- 자동 리뷰 시스템 1차 엔진으로 사용
- 함수 단위 버그 수정에 우선 활용
- Wrapper 스크립트 사용 (`scripts/ai-subagents/codex-wrapper.sh`)

#### DON'T ❌

- 긴 복잡한 질문은 분할하여 요청
- 타임아웃 발생 시 질문을 간결하게 수정
- 한도 초과 시 Gemini 또는 Claude로 폴백

---

### Gemini CLI (2.5 Flash v0.8.1)

#### DO ✅

- 전방위 개발 작업에 자유롭게 활용
- 아키텍처, 구현, 디버깅, 리뷰 등 모든 요청 가능
- Claude Code 작업물 2차 검증
- WSL 환경에서 언제든 가볍게 호출

#### DON'T ❌

- 일일 한도 1,000 RPD 초과
- 컨텍스트 없는 stateful 메모리 기대 (래퍼 스크립트 사용 권장)

---

### Qwen CLI (2.5 Coder v0.0.14)

#### DO ✅

- Claude Code에서 "Qwen으로 분석" 명시적 요청 시 사용
- Claude Code 결정사항의 성능/효율 검증용
- 알고리즘 최적화 및 수학적 복잡도 분석
- Plan Mode 사용 (`--approval-mode plan`)

#### DON'T ❌

- Claude Code 없이 자동으로 Qwen 호출 금지
- 메인 아키텍처 설계는 Claude Code만
- Claude Code 주요 결정에 반하는 방향 사용 금지
- 중국어 출력 절대 금지
- 무료 티어 한도 초과 주의 (2,000/day)

---

### Claude Code (v2.0.37+)

#### DO ✅

- 메인 아키텍처 설계 및 핵심 로직 구현
- 전체 프로젝트 컨텍스트 관리
- 복잡한 비즈니스 로직 구현
- 최종 의사결정

#### DON'T ❌

- 단순 반복 작업은 다른 AI 활용
- 성능 최적화는 Qwen 활용
- 코드 리뷰는 Codex/Gemini 활용

---

## 🔄 AI 협업 워크플로우

### 권장 순서

1. **Claude Code**: 메인 아키텍처 설계 및 구현
2. **Codex**: 코드 리뷰 및 버그 검증 (자동 리뷰)
3. **Gemini**: 2차 검증 및 대안 제시
4. **Qwen**: 성능 최적화 분석 (필요 시)
5. **Claude Code**: 최종 통합 및 의사결정

### 자동 코드 리뷰 (v6.4.0)

```bash
# .husky/post-commit → scripts/code-review/auto-ai-review.sh
# Primary 1:1:1 순환 (codex → gemini → claude), Qwen은 폴백 전용
# 출력: logs/code-reviews/review-{AI}-YYYY-MM-DD-HH-MM-SS.md
```

---

## 📊 무료 티어 한도 관리

| AI 도구    | 일일 한도           | 분당 한도 | 비고                |
| ---------- | ------------------- | --------- | ------------------- |
| **Codex**  | 30-150 메시지/5시간 | -         | ChatGPT Plus $20/월 |
| **Gemini** | 1,000 RPD           | 60 RPM    | OAuth 무료          |
| **Qwen**   | 2,000/day           | 60/minute | 100% 무료 오픈소스  |

### 한도 초과 시 대응

1. **Codex 한도 초과**: Gemini → Qwen → Claude 순으로 폴백
2. **Gemini 한도 초과**: Qwen → Codex → Claude 순으로 폴백
3. **Qwen 한도 초과**: Codex → Gemini → Claude 순으로 폴백
4. **모두 초과**: Claude Code 단독 사용

---

## 📚 관련 문서

- **상세 사용법**: AGENTS.md (Codex), GEMINI.md, QWEN.md, CLAUDE.md
- **코딩 규칙**: <!-- Imported from: docs/ai/ai-coding-standards.md -->
- **벤치마크**: <!-- Imported from: docs/ai/ai-benchmarks.md -->
- **자동 리뷰**: <!-- Imported from: scripts/code-review/auto-ai-review.sh -->

---

**핵심**: 각 AI 도구의 강점을 활용하고, 한도를 관리하며, 교차 검증으로 품질을 보장합니다.
